################# デフォルト設定 #################
use strict;
use utf8;

package set;

our $password = '';

our $logs_dir = './logs/';

our %rooms = ();

our %games = (
  'sw2' => {
    'name' => 'ソードワールド2.x',
    'status' => ['HP','MP','防護'],
  },
  'dx3' => {
    'name' => 'ダブルクロス3rd',
    'status' => ['HP','侵蝕','行動'],
  },
);

1;