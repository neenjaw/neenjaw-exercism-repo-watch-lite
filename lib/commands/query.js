const { Octokit } = require('@octokit/rest')
const chalk = require('chalk')
const CLI = require('clui')
const Spinner = CLI.Spinner
const inquirer = require('inquirer')

const spinnerLook = ['⣾', '⣷', '⣯', '⣟', '⡿', '⢿', '⣻', '⣽']
const status = new Spinner('', spinnerLook)

exports.command = '$0'
exports.desc = 'Lookup and modify your subscriptions'
exports.builder = {}
exports.handler = async function () {
  try {
    const token = process.env.GITHUB_TOKEN

    if (!token) {
      throw new Error('Github personal access token not set.')
    }

    const octokit = new Octokit({ auth: token })

    status.message('Finding Exercism repositories..')
    status.start()
    const orgRepos = await getOrgRepositories(octokit)
    console.log(' Found!')
    status.message('Finding your watched repositories..')
    const userSubscriptions = await getWatchedRepositories(octokit)
    console.log(' Found!')
    status.stop()

    const userSubscriptionsSet = new Set(userSubscriptions)
    const orgReposWatched = addWatchedStatus(orgRepos, userSubscriptionsSet)
    const reposToWatchAnswer = await inquirer.prompt(
      repoSelectQuestion(orgRepos, orgReposWatched)
    )
    const toWatchSet = new Set(reposToWatchAnswer.wantToWatch)

    const subscriptionsToAdd = reposToWatchAnswer.wantToWatch.filter(
      (repo) => !userSubscriptionsSet.has(repo)
    )
    const subscriptionsToRemove = orgReposWatched
      .filter(({ repo, isWatched }) =>
        isWatched ? !toWatchSet.has(repo) : false
      )
      .map(({ repo }) => repo)

    const confirmAnswer = await inquirer.prompt(
      repoSubscriptionConfirm(subscriptionsToAdd, subscriptionsToRemove)
    )

    if (confirmAnswer.confirmAdd || confirmAnswer.confirmRemove) {
      status.message('Making requested changes to Exercism subscriptions...')
      status.start()
      if (confirmAnswer.confirmAdd) {
        status.message('Adding subscriptions...')
        await addSubscriptions(octokit, subscriptionsToAdd)
        console.log(' Added!')
      }
      if (confirmAnswer.confirmRemove) {
        status.message('Removing subscriptions...')
        await removeSubscriptions(octokit, subscriptionsToRemove)
        console.log(' Removed!')
      }
      status.stop()
    }
  } catch (err) {
    console.log(' An error occurred.')
    status.stop()

    const { name } = err

    if (name === 'HttpError') {
      respondToHttpError(err)
    } else {
      console.log(err.message)
    }

    process.exit(1)
  }
}

function repoSelectQuestion(repos, reposWatched) {
  return [
    {
      type: 'checkbox',
      name: 'wantToWatch',
      message: 'Select the Exercism repositories that you wish to watch:',
      choices: repos,
      pageSize: 15,
      default: reposWatched
        .filter((repoEntry) => repoEntry.isWatched)
        .map((repoEntry) => repoEntry.repo),
    },
  ]
}

function repoSubscriptionConfirm(toAdd, toRemove) {
  return [
    {
      type: 'confirm',
      name: 'confirmAdd',
      message: `Confirm that you wish to ${chalk.green(
        'add'
      )} subscriptions to:\n${toAdd
        .map((repo) => chalk.green(`   + ${repo}`))
        .join('\n')}`,
      default: false,
      when: () => toAdd.length > 0,
    },
    {
      type: 'confirm',
      name: 'confirmRemove',
      message: `Confirm that you wish to ${chalk.red(
        'remove'
      )} subscriptions to:\n${toRemove
        .map((repo) => chalk.red(`   - ${repo}`))
        .join('\n')}`,
      default: false,
      when: () => toRemove.length > 0,
    },
  ]
}

function addWatchedStatus(repos, userSubscriptions) {
  return repos.map((repo) => {
    return {
      repo,
      isWatched: userSubscriptions.has(repo),
    }
  })
}

async function getOrgRepositories(octokit) {
  return await getRepositories(
    octokit,
    'GET /orgs/{org}/repos',
    {
      org: 'exercism',
      per_page: 100,
    },
    { filter: 'DEPRECATED' }
  )
}

async function getWatchedRepositories(octokit) {
  return await getRepositories(octokit, 'GET /user/subscriptions')
}

async function getRepositories(octokit, path, params, options = {}) {
  const repoResponses = await getAllPages(octokit, path, params)

  const repositoryNames = repoResponses
    .map((response) => response.data)
    .flat()
    .map((repository) => repository.full_name)
    .sort(alphabeticallyCaseInsensitive)

  if (options?.filter) {
    return repositoryNames.filter(
      (name) => !(name.indexOf(options.filter) !== -1)
    )
  }

  return repositoryNames
}

async function getAllPages(octokit, reqPath, reqParams = {}) {
  const pages = [await octokit.request(reqPath, reqParams)]

  const numberOfPages = getNumberOfPages(pages[0])

  for (let i = 2; i <= numberOfPages; i += 1) {
    reqParams.page = i
    pages.push(await octokit.request(reqPath, reqParams))
  }

  return pages
}

async function addSubscriptions(octokit, repos) {
  for (let index = 0; index < repos.length; index += 1) {
    const repo = repos[index]
    await addSubscription(octokit, repo)
  }
}

async function addSubscription(octokit, repo) {
  return await octokit.activity.setRepoSubscription({
    owner: 'exercism',
    repo: repo.substring(repo.indexOf('/') + 1),
    subscribed: true,
  })
}

async function removeSubscriptions(octokit, repos) {
  for (let index = 0; index < repos.length; index += 1) {
    const repo = repos[index]
    await removeSubscription(octokit, repo)
  }
}

async function removeSubscription(octokit, repo) {
  return await octokit.activity.deleteRepoSubscription({
    owner: 'exercism',
    repo: repo.substring(repo.indexOf('/') + 1),
  })
}

function getNumberOfPages(response) {
  const {
    headers: { link: links },
  } = response
  const lastLink = links
    .split(', ')
    .map((links) => links.split('; '))
    .filter(([, rel]) => rel === 'rel="last"')[0]

  return Number(lastLink[0].match(/(&|\?)page=(\d+)/)[2])
}

function alphabeticallyCaseInsensitive(a, b) {
  return a.toLowerCase().localeCompare(b.toLowerCase())
}

function respondToHttpError(HttpError) {
  const { message, status } = HttpError

  if (status === 401) {
    console.log(`${message}: Double check that the set token is correct.`)
  } else if (status === 404) {
    console.log(
      `${message}: Make sure that the GitHub personal access token has the correct permissions.`
    )
  } else {
    console.log('An HTTP error occurred with the request. Aborted.')
  }
}
