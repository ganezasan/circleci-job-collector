# circleci-job-collector

This tool is for fetching recent jobs data on circleci.com or CircleCI Server.

# install & setup

```
$ node -v
v14.13.0
$ npm install
$ npm link
```

# set environment variable

```
$ cat .env
CIRCLECI_HOST=http://<SERVER_DOMAIN or SERVER_IP>
CIRCLECI_TOKEN=<CircleCI API token created by server admin user>
```

# run

## help

```
$ cjc --help
Use circleci-job-collector cli.

Usage:
  cjc [command] [flags]

Commands:
  fetch            Fetch all jobs data on circleci and export data as json file
    -l, --limit        The number of builds to return. Default is 1000
    --offset           The API returns builds starting from this offset. Default is 0
    --project          The project slug which is to return specific project builds. Project slug in the form `<github or bitbucket>/org-name/repo-name`
    --server           Use server admin endpoint `v1/admin/recent-builds`. Default is `false`

  convert          Convert json file to csv file
    --inputFilename    The input json file name. Default is ./jobs.json
    --outputFilename   The output csv file name. Default is ./summary.csv
    -w,--workflowName  The workflow name for filtering jobs. *Requred option*
    -j, --jobName      The job name for filtering jobs. *Requred option*

  showTiming       Show timing data by each steps
    --jobSlug          The job slug in the form `<github or bitbucket>/org-name/project-name/job-id`
    --stepName         The step name for filtering steps. Default is showing all steps.

Flags:
  -h, --help      help for cjc
```

## fetch

This script exports job data to `jobs.json` file. The default limit of job count is 1000.

```
$ cjc fetch
```

### fetch options

| Options | Type | Required | Default | Description |
|-----------------|------|----------|---------|-------------|
| `-l`, `--limit` | `Number` | no | 1000 | The number of builds to return. |
| `--offset` | `Number` | no | 0 | The API returns builds starting from this offset. |
| `--project` | `string` | no | | The project slug which is to return specific project builds. Project slug in the form `<github or bitbucket>/org-name/repo-name` |
| `--server` | `Boolean` | no | false | Use server admin endpoint `v1/admin/recent-builds` |

### example

```
$ cjc fetch --limit=100
or
$ cjc fetch -l 100
```

## convert

This command converts json file which is created by `fetch` command to csv file.

```
$ cjc convert --workflowName=workflow --jobName=build
```

### fetch options

| Options | Type | Required | Default | Description |
|-----------------|------|----------|---------|-------------|
| `--inputFilename` | `string` | yes | ./jobs.json | The input json file name. |
| `--outputFilename` | `string` | yes | ./summary.csv | The output csv file name. |
| `-w`, `--workflowName` | `string` | yes | | The workflow name for filtering jobs. |
| `-j`, `--jobName` | `string` | yes | | The job name for filtering jobs. |

## showTiming

This command shows a job's running time with bar chart. This is useful to visualize the execution time for each step when using parallelism in a job.

```
cjc showTiming --jobSlug=gh/ganezasan/ci-test/1 --stepName='Run Jest Test'
Step: Run Jest Test
API URL: https://circleci.com/api/v1.1/project/gh/ganezasan/ci-test/1
JOB URL: https://circleci.com/gh/ganezasan/ci-test/1
   0 [■■■■■■■■■■■■■                           ] 5.115s
   1 [■■■■■■■■■■■■■■■■■■■■                    ] 7.749s
   2 [■■■■■■■■■■■■■■■■■■■■■■■■                ] 9.129s
   3 [■■■■■■■■■■■■■■                          ] 5.374s
   4 [■■■■■■■■■■                              ] 3.77s
   5 [■■■■■■■■                                ] 3.005s
   6 [■■■■■■■■■■■■■■■                         ] 5.59s
   7 [■■■■■■■■■■■■■■                          ] 5.191s
   8 [■■■■■■■■■                               ] 3.277s
   9 [■■■■■■■■■■■■■■■■■■                      ] 6.788s
  10 [■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■] 15.186s
 Avg [■■■■■■■■■■■■■■■■■                       ] 6.4s
 ```

 ### showTiming options

| Options | Type | Required | Default | Description |
|-----------------|------|----------|---------|-------------|
| `--jobSlug` | `string` | yes |  | The job slug which is to return specific job. Job slug in the form `<github or bitbucket>/org-name/repo-name/job-number` |
| `--stepName` | `string` | no |  | The step name for filtering steps. Default is showing all steps. |


## showSteps

This command shows a job's step's name and number.

```
cjc showSteps --jobSlug=gh/ganezasan/circleci-demo-ios/149
0: Spin up environment
1: Preparing environment variables
2: Checkout code
3: Restoring cache
4: Install gems with Bundler
5: Saving cache
6: pre-start simulator
7: Fastlane
8: Uploading artifacts
9: Uploading test results
10: Upload Coverage Results
 ```

 ### showSteps options

| Options | Type | Required | Default | Description |
|-----------------|------|----------|---------|-------------|
| `--jobSlug` | `string` | yes |  | The job slug which is to return specific job. Job slug in the form `<github or bitbucket>/org-name/repo-name/job-number` |

# run in docker

```
sudo docker run -it --rm -v `pwd`:/tmp node:14.13.0 bash -c 'cd /tmp && npm cache verify && npm install && npm link && cjc fetch'
```


