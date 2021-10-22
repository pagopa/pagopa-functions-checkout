#!/bin/bash

VERBOSE=0
RUN=0
usage=NOK
SERVICE=0
TEST_PASSED=NOK
BASE_URL_PATH=http://localhost:7071

help="
$0 [-h] [-v] [-u] <BASE_URL_PATH> [-s] <SERVICE_NAME>\n
-h : help
-v : verbose : usefull only with NOT test
-u : url base path (DEFAULT = http://localhost:7071 
"
# -s : run and test service <SERVICE_NAME> : allowed services {Info,GetPaymentInfo,ActivatePayment,GetActivationStatus} : DEFAULT (ALL services)

# Check parameter
while (( "$#" )); do
    case "$1" in
        -h|--help)
            echo ""
            echo "Usage :"
            echo "$help"
            echo ""
            exit 0
        ;;

        -v|--verbose)
            echo "Verbose mode enable !!!"
            VERBOSE=1
            shift
        ;;

        # -s|--service)
        #     echo ".........1"
        #     if [[ "$2" =~ ^(Info|GetPaymentInfo|ActivatePayment|GetActivationStatus)$ ]]; then
        #         RUN=$1
        #         SERVICE=$2
        #         shift 2
        #     else
        #         echo "Error: Argument for '$2' is no allowed" >&2
        #         exit 1
        #     fi
        # ;;

         -u|--url)
             BASE_URL_PATH=$2
             shift 2
        ;;

        *) # preserve positional arguments
            usage=OK
            break
        ;;

    esac
done

if [ "$usage" = "OK" ] || [ "$#" -eq "0" ]
then
    echo "Base URL path [${BASE_URL_PATH}]"
    echo "Init ..."
    rm -rf _TEMP && mkdir _TEMP && cd _TEMP
    echo -e "\t Clone IO mock env"
    git clone https://github.com/pagopa/io-mock.git io-mock && cd $_
    # echo -e "\t Generate and runs all docker IO images (pagopa-proxy, nodoSPC and other stuffs )..."
    yarn install && yarn start -d

    echo -e "\t Start io-functions-pay-portal"
    yarn install && yarn docker

    echo "Tests :"
    echo -e "\t 1) INFO"
    INFO_RESP=`curl -o /dev/null -s -w "%{http_code}\n" ${BASE_URL_PATH}/info`
    if [ "$INFO_RESP" = "200" ]
    then
      echo -e "\t 2) VERIFY"
      VERIFY_RESP=`curl -o /dev/null -s -w "%{http_code}\n"   ${BASE_URL_PATH}/api/v1/payment-requests/01234567891010001234567890123`
      if [ "$VERIFY_RESP" = "200" ]
      then
        echo -e "\t 3) ACTIVATE"
        ACTIVATE_RESP=`curl -o /dev/null -s -w "%{http_code}\n"   ${BASE_URL_PATH}/api/v1/payment-requests/01234567891010001234567890123`
        if [ "$ACTIVATE_RESP" = "200" ]
        then
          TEST_PASSED=OK
        else
          if [ $VERBOSE -eq 1 ]; then
            curl ${BASE_URL_PATH}/api/v1/payment-requests/01234567891010001234567890123
          fi
        fi
      else
        if [ $VERBOSE -eq 1 ]; then
          curl ${BASE_URL_PATH}/api/v1/payment-requests/01234567891010001234567890123
        fi
      fi
    else
      if [ $VERBOSE -eq 1 ]; then
        curl ${BASE_URL_PATH}/info
      fi
    fi

    if [ "$TEST_PASSED" = "OK" ]
    then
      echo "All tests passed :) "
    else
      echo "Something goes wrong ... :("
    fi

else
    echo ""
    echo "Bad usage !!!"
    echo "$help"
    echo ""
fi
