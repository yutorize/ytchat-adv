use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;
use HTML::Template;
use CGI::Cookie;

if($::in{'type'} eq 'text') { require './lib/pl/log-text.pl'; }
else                        { require './lib/pl/log-mold.pl'; }

###################
### 出力
if($::in{'type'} eq 'text') {
  print "Content-Type: text/plain\n\n";
  print logOutput();
}
else {
  print "Content-Type: text/html\n\n";
  if($::in{'type'} eq 'simple'){
    print logOutput();
  }
  if($::in{'type'} eq 'download'){
    print logOutput();
  }
  else {
    print logOutput(
      "roomList" => 1,
      "logList" => 1,
    );
  }
}

exit;

1;