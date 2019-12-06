use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;
use HTML::Template;
use CGI::Cookie;

require './lib/pl/log-mold.pl';

###################
### 出力
my $logs = logOutput(
  "old" => $::in{"log"}?1:0,
  "roomList" => 1,
  "logList" => 1,
);
print "Content-Type: text/html\n\n";
print $logs;

exit;

1;