# circleci-job-collector

This tool is for fetching all the job data under the CircleCI Server.

# install

```
$ node -v
v12.18.4
$ npm install
```

# set environment variable

```
$ cat .env 
CIRCLECI_HOST=http://<SERVER_DOMAIN or SERVER_IP>
CIRCLECI_TOKEN=<CircleCI API token created by server admin user>
```

# run

This script exports job data to `jobs.json` file.

```
$ npm start
```
