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

This script exports job data to `jobs.json` file. The default limit of job count is 1000.

```
$ npm start
```

You can specify the limit of job count.

```
$ npm start -- --limit=100
or 
$ npm start -- -l=100
```

## run in docker 

```
sudo docker run -it --rm -v `pwd`:/tmp node:12.18.4 bash -c 'cd /tmp && npm cache verify && npm install && npm start'
```
