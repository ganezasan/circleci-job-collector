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
  fetch           Fetch all jobs data on circleci and export data as json file
    -l, --limit   The number of builds to return. Default is 1000
    --offset      The API returns builds starting from this offset. Default is 0
    --project     The project slug which is to return specific project builds. Project slug in the form `<github or bitbucket>/org-name/repo-name`
    --server      Use server admin endpoint `v1/admin/recent-builds`. Default is `false`

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
|-----------|------|----------|---------|-------------|
| `--limit` or `-l` | `Number` | no | 1000 | The number of builds to return. |
| `--offset` | `Number` | no | 0 | The API returns builds starting from this offset. |
| `--project` | `string` | no | | The project slug which is to return specific project builds. Project slug in the form `<github or bitbucket>/org-name/repo-name` |
| `--server` | `Boolean` | no | false | Use server admin endpoint `v1/admin/recent-builds` |

### example

```
$ cjc fetch --limit=100
or 
$ cjc fetch -l 100
```

## run in docker 

```
sudo docker run -it --rm -v `pwd`:/tmp node:14.13.0 bash -c 'cd /tmp && npm cache verify && npm install && npm link && cjc fetch'
```
