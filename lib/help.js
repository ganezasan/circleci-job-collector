export const HELP = [
  'Use circleci-job-collector cli.\n\n',
  'Usage:\n',
  '  cjc [command] [flags]\n\n',
  'Commands:\n',
  '  fetch           Fetch all jobs data on circleci and export data as json file\n',
  '    -l, --limit   The number of builds to return. Default is 1000\n',
  '    --offset      The API returns builds starting from this offset. Default is 0\n',
  '    --project     The project slug which is to return specific project builds. Project slug in the form `<github or bitbucket>/org-name/repo-name`\n',
  '    --server      Use server admin endpoint `v1/admin/recent-builds`. Default is `false`\n',
  'Flags:\n',
  '  -h, --help      help for cjc',
];
