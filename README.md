# Yitpin Chin Imagegram API Challenge

## Table of contents

- [Yitpin Chin Imagegram API Challenge](#yitpin-chin-imagegram-api-challenge)
  - [Table of contents](#table-of-contents)
  - [Tech Stack](#tech-stack)
  - [Current System Design](#current-system-design)
    - [DynamoDB Database Design](#dynamodb-database-design)
    - [Limitations with the Current System Design](#limitations-with-the-current-system-design)
  - [Improved Future System Design](#improved-future-system-design)
  - [Handling Throughput and Usage Forecast](#handling-throughput-and-usage-forecast)
  - [Using the API](#using-the-api)
      - [Create a User](#create-a-user)
      - [Get a User](#get-a-user)
      - [Create a Post with Image](#create-a-post-with-image)
      - [Get a Post](#get-a-post)
      - [Get List of all Posts by a User with the two most recent comments](#get-list-of-all-posts-by-a-user-with-the-two-most-recent-comments)
      - [Comment on a Post](#comment-on-a-post)
      - [Delete a Comment on a Post](#delete-a-comment-on-a-post)
  - [Testing](#testing)
  - [What should be done before shipping to production](#what-should-be-done-before-shipping-to-production)
  - [How to Deploy an Instance of the API to Your AWS Account](#how-to-deploy-an-instance-of-the-api-to-your-aws-account)
  - [Note](#note)

## Tech Stack

- Node.js ([download](https://nodejs.org/en/download/) if required)
- [Serverless Framework](https://www.serverless.com/)
- AWS ([API Gateway](https://aws.amazon.com/api-gateway/), [Lambda Functions](https://aws.amazon.com/lambda/), [DynamoDB](https://aws.amazon.com/dynamodb/), [S3](https://aws.amazon.com/s3/))

## Current System Design

![Current System Design Diagram](/screenshots/current_design.jpg)

- Every user request to the API is routed through **API Gateway** and then forwarded to one of the seven **Lambda Functions** depending on what the user is trying to accomplish.
- Images uploaded by the user are processed, resized and then stored in **S3**.
- Other types of data are stored in a single table in **DynamoDB**.

### DynamoDB Database Design

- DynamoDB is a managed NoSQL database by AWS that offers fast and reliable performance even as it scales.
- DynamoDB was chosen as it fits well with the serverless compute model.
- Data modelling with DynamoDB can be tricky for those used to relational databases and thus requires a different approach.
- A single-table design was used to model the data for this API. This [approach](https://www.alexdebrie.com/posts/dynamodb-single-table/) is recommended by the AWS team to take full advantage of DynamoDB's capabilities.
- By using a single-table design, we can reduce the number of calls to databases (network I/Os are usually the slowest part of an application).
- DynamoDB Key Schema for the API:

  | Entity  | PK                   | SK                  |
  | ------- | -------------------- | ------------------- |
  | User    | USER#{username}      | USER#{username}     |
  | Post    | USERPOST#{username}  | POST#{postId}       |
  | Comment | POSTCOMMENT#{postId} | COMMENT#{commentId} |

- How it looks in the AWS console:

![DynamoDB Design Diagram in AWS console](/screenshots/dynamoDB_design.jpg)

### Limitations with the Current System Design

- The current system design has some limitations that means it is not suitable for processing larger requests. These are:
  - AWS API Gateway has a 29s request timeout limit. It also has a 10MB payload size limit.
  - AWS Lambda has a 6MB payload size limit. It also has a 15 minutes invocation timeout limit but since but it is sitting behind API Gateway, it will also have a 29s timeout limit.
- These limits should be adequate for most images taken by smartphones but may pose issues for when trying to upload bigger images (e.g. from a DSLR camera).
- The next section will talk about how the design can be improved to handle large requests.

## Improved Future System Design
- This design follows an asynchronous API pattern to allow the application to accept large requests without hitting timeout or request limits.

![Future System Design Diagram](/screenshots/future_design.jpg)

1. The first request tells the API that the user wants to upload an image. It generates a [S3 presigned URL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) and returns it to the client.
2. The second executes the file upload directly to S3, using the presigned URL, which doesn't have a timeout.
3. The client then continuously polls for the status of the upload job through a polling Lambda. Once the polling Lambda can see the file in S3, the client will be notified that the upload was successful.

## Handling Throughput and Usage Forecast
- If the traffic and throughput pattern is known, the different AWS services can be configured easily to scale to the demands of the applications traffic.
- The application can be deployed to multiple regions to spread out the workload and improve latency for the end users.

## Using the API
The API is up and running in my personal AWS account. You are welcomed to make requests to it using something like [Postman](https://www.postman.com/downloads/).

#### Create a User

- **URL**: `https://pfqwa4e4il.execute-api.us-east-1.amazonaws.com/dev/users`
- **Method**: `POST`
- **Request payload required fields**

  ```json
  {
      "username": "john", #string
  }
  ```

#### Get a User

- **URL**: `https://pfqwa4e4il.execute-api.us-east-1.amazonaws.com/dev/users/{username}`
- **URL Parameters** : `username` of a user that has been created
- **Method**: `GET`


#### Create a Post with Image

- **URL**: `https://pfqwa4e4il.execute-api.us-east-1.amazonaws.com/dev/users/{username}/posts`
- **URL Parameters** : `username` of a user that wants to create the post
- **Method**: `POST`
- **Note**: You must upload a file as part of this request. If you are using Postman, this [post](https://stackoverflow.com/a/16022213) will show you how. Other API clients should have the same capabilities.

#### Get a Post

- **URL**: `https://pfqwa4e4il.execute-api.us-east-1.amazonaws.com/dev/users/{username}/posts/{postId}`
- **URL Parameters** : `username` of the user who owns the post with `postId`
- **Method**: `GET`

#### Get List of all Posts by a User with the two most recent comments

- **URL**: `https://pfqwa4e4il.execute-api.us-east-1.amazonaws.com/dev/users/{username}/allposts`
- **URL Parameters** : `username` of the user whose posts you want to see
- **Method**: `GET`

#### Comment on a Post

- **URL**: `https://pfqwa4e4il.execute-api.us-east-1.amazonaws.com/dev/users/{username}/posts/{postId}/comments`
- **URL Parameters** : `username` is the owner of the post with `postId` that you want to comment on
- **Method**: `POST`
- **Request payload required fields**

  ```json
  {
      "commenterUsername": "mary", #string
      "content": "This is a comment!" #string
  }
  ```

#### Delete a Comment on a Post

- **URL**: `https://pfqwa4e4il.execute-api.us-east-1.amazonaws.com/dev/users/{username}/posts/{postId}/comments/{commentId}`
- **URL Parameters** : `username` is the owner of the post with `postId`. `commentId` of the comment you want to delete and must belong to the post.
- **Method**: `DELETE`
- **Request payload required fields**

  ```json
  {
      "deletingUsername": "mary" #string
  }
  ```

## Testing
- I have included some basic testing as part of this challenge, mainly unit tests of the data models.
- I would've like to have implemented some tests for the calls to DynamoDB and S3. This would've involved mocking out these services so that the tests isn't actually interacting with the actual services. From experience, this would've taken some amount of time that I felt fell outside the scope of the challenge. 
- I used the [Jest](https://jestjs.io/) testing library. You can run the tests with `npm run test`

## What should be done before shipping to production

- More thorough request validations
- Unit tests with high coverage, integration tests, E2E tests
- CI/CD pipeline with static code analysis and vulnerability checks
- Observability: logs, metrics, traces, alerts

## How to Deploy an Instance of the API to Your AWS Account

- [Download](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) the AWS CLI.
- Generate access key and secret for AWS or use an existing one.
- Run `aws configure` command and enter the required information.
- Install Serverless Framework via `npm install -g serverless`.
- Run `serverless deploy` from this repository.
- It will now create the resources specified in the `serverless.yml` file in your AWS account.
- You can run `serverless info` to see details about the service and its endpoints
- Run `serverless remove` to remove the deployed service.

## Note

- Feel free to reach out if having issues with setting this up but should be fairly straightfoward. Have a good day :)
