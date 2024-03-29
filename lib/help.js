export const HELP = [
  'Use circleci-job-collector cli.\n\n',
  'Usage:\n',
  '  cjc [command] [flags]\n\n',
  'Commands:\n',
  '  fetch            Fetch all jobs data on circleci and export data as json file\n',
  '    -l, --limit        The number of builds to return. Default is 1000\n',
  '    --offset           The API returns builds starting from this offset. Default is 0\n',
  '    --project          The project slug which is to return specific project builds. Project slug in the form `<github or bitbucket>/org-name/repo-name`\n',
  '    --server           Use server admin endpoint `v1/admin/recent-builds`. Default is `false`\n',
  '\n',
  '  convert          Convert json file to csv file\n',
  '    --inputFilename    The input json file name. Default is ./jobs.json\n',
  '    --outputFilename   The output csv file name. Default is ./summary.csv\n',
  '    -w,--workflowName  The workflow name for filtering jobs. *Requred option*\n',
  '    -j, --jobName      The job name for filtering jobs. *Requred option*\n',
  '\n',
  '  showTiming       Show running times of a step in each parallel jobs\n',
  '    --jobSlug          The job slug in the form `<github or bitbucket>/org-name/project-name/job-id`\n',
  '    --stepName         The step name for filtering steps. Default is showing all steps.\n',
  '\n',
  '  showSteps        Show steps name in a job\n',
  '    --jobSlug          The job slug in the form `<github or bitbucket>/org-name/project-name/job-id`\n',
  'Flags:\n',
  '  -h, --help      help for cjc',
];
