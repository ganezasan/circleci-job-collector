# circleci-job-collector

This tool is for fetching all the job data under the CircleCI Server.

# install

```
$ node -v
v14.13.0
$ npm install
```

# set environment variable

```
$ cat .env 
CIRCLECI_HOST=http://<SERVER_DOMAIN or SERVER_IP>
CIRCLECI_TOKEN=<CircleCI API token created by server admin user>
```

# run

This script exports job data to `jobs.json` file. The default limit of job count is 1000.

```
$ npm start
```

## options

| Options | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `--limit` or `-l` | `Number` | no | 1000 | The number of builds to return. |
| `--offset` | `Number` | no | 0 | The API returns builds starting from this offset. |
| `--project` | `string` | no | | The project slug which is to return specific project builds. Project slug in the form `<github or bitbucket>/org-name/repo-name` |
| `--server` | `Boolean` | no | false | Use server admin endpoint `v1/admin/recent-builds` |

## example

```
$ npm start -- --limit=100
or 
$ npm start -- -l 100
```

## run in docker 

```
sudo docker run -it --rm -v `pwd`:/tmp node:14.13.0 bash -c 'cd /tmp && npm cache verify && npm install && npm start'
```
