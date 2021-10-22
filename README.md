# pagoPA checkout Function App

- [IO Functions Pay Portal](#pagopa-functions-checkout)
  - [Local development](#local-development)
    - [Prerequisites](#prerequisites)
    - [Backend side](#backend-side)
    - [Frontend side](#frontend-side)
## Local development

### Prerequisites

- [yarn](https://yarnpkg.com/)
- [node](https://nodejs.org/it/)
- [docker](https://www.docker.com/)

### Backend side

Go to backend project directory
```
cd pagopa-functions-checkout
```

set local environment variables typing :

```shell
cp env.example .env
```
> change the values ​​according to your configuration if you think necessary (_OPTIONAL_)

then typing `yarn docker` as shortcut to build & run locally backend, that performs the following commands
> 
```
yarn install
yarn build
docker-compose up -d --build
docker-compose logs -f functions
open http://localhost/some/path/test
```

If all right, you'll see something like that 🚀

```bash
functions_1  | Functions:
functions_1  | 
functions_1  |  ActivatePayment: [POST] http://localhost:7071/api/v1/payment-activations
functions_1  | 
functions_1  |  GetActivationStatus: [GET] http://localhost:7071//api/v1/payment-activations/{codiceContestoPagamento}
functions_1  | 
functions_1  |  GetPaymentInfo: [GET] http://localhost:7071/api/v1/payment-requests/{rptId}
functions_1  | 
functions_1  |  Info: [GET] http://localhost:7071/info
```



### Frontend side
