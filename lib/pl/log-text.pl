use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;
use HTML::Template;
use Encode qw/encode decode/;
use JSON::PP;
use CGI::Cookie;

###################
### ログ成形

sub logOutput {
my %opt = (
  "type" =>"now",
  @_,
);

my %cookies = fetch CGI::Cookie;
my $cookie_id = $cookies{'ytchat-userid'}->value if(exists $cookies{'ytchat-userid'});

my $id = $::in{'id'}; #部屋ID

my %games = %set::games;
my %rooms;
if(sysopen(my $FH, './room/list.dat', O_RDONLY)){
  my $text = join('', <$FH>);
  %rooms = %{ decode_json(encode('utf8', $text)) } if $text;
  close($FH);
}
foreach my $key (keys %set::rooms){
  $rooms{$key} = $set::rooms{$key};
}

###################
### 部屋の有無をチェック
my $error_flag = (!exists($rooms{$id}) && !$::in{'log'}) ? 1 : 0;

my $logs_dir = ($id && $rooms{$id}{'logs-dir'}) ? $rooms{$id}{'logs-dir'} : $set::logs_dir;

my @tabs = $id ? ($rooms{$id}{'tab'} ? @{$rooms{$id}{'tab'}} : ('メイン','サブ')) : ();

###################
### ログ本体

my $title = $rooms{$id}{'name'};
my $subtitle = $::in{'log'}?$::in{'log'}:'現行ログ';

my $logfile; my %logconfig;
if($::in{"log"}){ #過去ログ
  if(-d "${logs_dir}/_$::in{'log'}/"){
    $logfile = "${logs_dir}/_$::in{'log'}/log.dat";
    open(my $FH, "${logs_dir}/_$::in{'log'}/config.pl");
    my $json;
    $json .= $_ while <$FH>;
    close($FH);
    if($json){
      %logconfig = %{ decode_json( encode('utf-8', $json) ) };
      $title = $logconfig{'title'};
      @tabs = $logconfig{'tabs'} ? @{ $logconfig{'tabs'} } : @tabs;
    }
  }
  else {
    $logfile = "${logs_dir}/$::in{'log'}.dat";
  }
}
else { #現行ログ
  $logfile = "./room/${id}/log-all.dat";
}
sysopen (my $FH, $logfile, O_RDONLY) or $error_flag = 1;
my @logs;
my $before_tab;
my $before_name;
my $before_color;
my $before_user;
my @bgms; my %bgms;
my @bgis; my %bgis;
my %stat;
my %stat_count;
my %user_color;
my $tagconvert_on = %logconfig ? 1 : $::in{"log"} ? 0 : 1;
foreach (<$FH>){
  chomp;
  if($_ =~ s/^>//) {
    my ($name, $tab) = split(/<>/, $_);
    $title = $name;
    @tabs = split(',', $tab);
    next;
  }
  
  my ($num, $date, $tab, $name, $color, $comm, $info, $system, $user, $address) = split(/<>/, $_);
  my $userid;
  $user =~ s/<(.+?)>$/$userid = $1; '';/e;
  $user_color{$name} = $color;
  
  my $openlater;
  if($address){
    if($address =~ s/\#$//){ $openlater = 1; } #青秘話=1
    # 過去ログ
    if($::in{"log"}){
      #赤秘話なら非表示（青は通す）
      if(!$openlater){ next; }
    }
    # 現行ログ
    else {
      #自発信でも自受信でもなければ非表示（赤青は問わない）
      if($cookie_id ne $userid && $cookie_id ne $address){ next; }
    }
  }
  
  my $type = $system;
     #$type =~ s/:.*?$//;
  my $game = ($system =~ /^dice:(.*)$/) ? $1 : '';
  my $code;
  my @infos = split(/<br>/,$info);
  foreach (@infos){
    { $_ =~ s/\<\<(.*)$//; }
  }
  $info = join('<br>', @infos);
  if(!$tabs[$tab-1]){ $tabs[$tab-1] = "タブ${tab}"; }
  
  if($system =~ /^rewrite:([0-9]+)$/){
    my $target = $1;
    foreach my $data (@logs){
      foreach my $line (@{ $data->{'LogsDD'} }){
        if($line->{'NUM'} eq $target){ $line->{'COMM'} = $comm; }
      }
    }
    next;
  }

  $comm =~ s/<br>/\n/gi;
  $comm =~ s/&lt;/</gi;
  $comm =~ s/&gt;/>/gi;
  $info =~ s/<br>/\n/gi;
  
  if ( $before_tab   ne $tab
    || $before_name  ne $name
    || $before_color ne $color
    || $before_user  ne $user
    || ($name eq '!SYSTEM')
  ){
    push(@logs, {
      "NUM"    => $num,
      "TAB"    => $tab,
      "TABNAME"=> $tabs[$tab-1],
      "USER"   => $user,
      "NAME"   => $name,
      "COLOR"  => $color,
      "LogsDD" => [],
    });
  }
  
  push(@{$logs[$#logs]{'LogsDD'}},{
    "NUM"   => $num,
    "DATE"  => $date,
    "COMM"  => $comm,
    "TYPE"  => $type,
    "INFO"  => $info,
    "GAME"  => $game,
  });
  
  $before_tab   = $tab;
  $before_name  = $name;
  $before_color = $color;
  $before_user  = $user;
}
close($FH);

my $output = "$title ($subtitle)\n\n";
$output .= "--------------------\n\n";
my %colors;

foreach my $dl (@logs){
  $output .= "[$dl->{'TABNAME'}] $dl->{'NAME'} :";
  $output .= " $dl->{'COLOR'} :" if($dl->{'COLOR'} ne $colors{$dl->{'NAME'}});
  $output .= "\n";
  foreach my $dd (@{ $dl->{'LogsDD'} }){
    if($dd->{'COMM'}){ $output .= "$dd->{'COMM'}\n" };
    if($dd->{'INFO'}){ $output .= "$dd->{'TYPE'}>> $dd->{'INFO'}\n" };
  }
  $output .= "\n";

  $colors{$dl->{'NAME'}} = $dl->{'COLOR'};
}


###################
### 出力
return $output;

}

1;