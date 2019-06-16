#!/usr/bin/env bash

if [[ -z $(which piHomeEasy) ]]
then
  echo "Could not find 'piHomeEasy' installed on the system."
  exit 1
fi

readonly HELP="This script is a wrapper around the 'piHomeEasy' -command,
and allows for queuing up multiple 'piHomeEasy' -operations in one single command.
The first two arguments are required and represent 'transmitter pin' and 'emitter ID', in that order.
Any following arguments are interpreted as 'accessory id', 'state' -pairs, where every uneven argument (3rd, 5th, 7th, 9th argument, etc.)
is an id of an accessory and the consecutive (even) argument is the state to which the accessory will be changed."

args_copy_1=("$@")
while [[ ${args_copy_1[0]} ]]
do
  case ${args_copy_1[0]} in
    -h|--help )
      echo "$HELP"
      exit 0
      ;;
    * )
      args_copy_1=("${args_copy_1[@]:1}")
      ;;
  esac
done

transmitter_pin_is_valid() {
  if [[ -n $1 ]] && [[ $1 -ge 0 ]] && [[ $1 -le 16 ]]; then return 0
  else return 1
  fi
}

emitter_id_is_valid() {
  if [[ -n $1 ]] && [[ $1 -ge 0 ]] && [[ $1 -le 67108862 ]]; then return 0
  else return 1
  fi
}

accessory_is_valid() {
  if [[ -n $1 ]] && [[ $1 -ge 0 ]] && [[ $1 -le 15 ]]; then return 0
  else return 1
  fi
}

state_is_valid() {
  if [[ -n $1 ]] && [[ $1 =~ (on)|(off) ]]; then return 0
  else return 1
  fi
}

readonly TRANSMITTER_PIN=$1
readonly EMITTER_ID=$2

shift 2

if ! transmitter_pin_is_valid $TRANSMITTER_PIN || ! emitter_id_is_valid $EMITTER_ID
then
  echo "The first two arguments which should be 'transmitter pin' and 'emitter ID' where incorrectly provided. Use option -h or --help for more information."
  exit 1
fi

args_copy_2=("$@")
while [[ ${args_copy_2[0]} ]]
do
  if accessory_is_valid ${args_copy_2[0]} && state_is_valid ${args_copy_2[1]}; then
    args_copy_2=("${args_copy_2[@]:2}")
  else
    echo "Invalid arguments where provided. Use option -h or --help for more information."
    exit 1
  fi
done

while [[ $1 ]]
do
  piHomeEasy $TRANSMITTER_PIN $EMITTER_ID $1 $2
  shift 2
done

exit 0
