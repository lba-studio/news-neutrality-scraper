set -e

[ -z "$1" ] && echo "Please pass in the environment name as an argument (e.g. \"./.ci/deploy.sh prod\")"  && exit 1

# npm run lint
# npm run clean
# npm run build

TEMPLATE_FILENAME="template.yaml"
PACKAGED_TEMPLATE_FILENAME="packaged.yaml"
S3_BUCKET_NAME="nodescrape-$1"
STACK_NAME="nodescrape-$1"
AWSCLI_ARGS="" # used to be --profile $1
# PARAMETER_CONFIG_PATH="./.ci/$1.yaml"
# PARAMETER_OVERRIDES_ARG="--parameter-overrides `sed -e '/#.*/d;s/: */=/;s/\r//g;s/$//g' $PARAMETER_CONFIG_PATH`"
PARAMETER_OVERRIDES_ARG="--parameter-overrides \
NewsApiApikey=$NODESCRAPE_NEWSAPI_APIKEY \
LogLevel=INFO"

echo "---Deployment Config---"
echo "TEMPLATE_FILENAME=$TEMPLATE_FILENAME"
echo "PACKAGED_TEMPLATE_FILENAME=$PACKAGED_TEMPLATE_FILENAME"
echo "S3_BUCKET_NAME=$S3_BUCKET_NAME"
echo "STACK_NAME=$STACK_NAME"
echo "AWSCLI_ARGS=$AWSCLI_ARGS"

# check bucket exists
if aws s3 ls "$S3_BUCKET_NAME" $AWSCLI_ARGS > /dev/null
then
  echo "Bucket $S3_BUCKET_NAME exists!"
else
  # If S3 bucket does not exist, create a new one.
  echo "No bucket named $S3_BUCKET_NAME found"
  echo "Create a new bucket: $S3_BUCKET_NAME"
  aws s3 mb s3://$S3_BUCKET_NAME $AWSCLI_ARGS
fi

echo "---"
echo "Running sam package..."
sam package --template-file $TEMPLATE_FILENAME --s3-bucket $S3_BUCKET_NAME --output-template-file $PACKAGED_TEMPLATE_FILENAME  $AWSCLI_ARGS
echo "sam package complete."

echo "---"
echo "Running sam deploy..."
sam deploy --template-file $PACKAGED_TEMPLATE_FILENAME --stack-name $STACK_NAME --capabilities CAPABILITY_IAM --no-fail-on-empty-changeset $AWSCLI_ARGS $PARAMETER_OVERRIDES_ARG
echo "sam deploy complete."
