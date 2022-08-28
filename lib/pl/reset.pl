use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;
use Encode qw/encode decode/;
use JSON::PP;

###################
### ルームリセット

my $id = $::in{'room'}; #部屋ID

my %userrooms;
if(sysopen(my $FH, './room/list.dat', O_RDONLY)){
  my $text = join('', <$FH>);
  %userrooms = %{ decode_json(encode('utf8', $text)) } if $text;
  close($FH);
}
## パスワードチェック
unless(
  #管理パスが一致すれば通す
  $set::password eq $::in{'password'}
  #ユーザー作成部屋なら
  || ($userrooms{$id} && (
    #パスワード設定がなければ通す
        !$userrooms{$id}{'pass'}
    #もしくはパスワード設定があり入力と一致すれば通す
    || ( $userrooms{$id}{'pass'} && c_crypt($::in{'password'},$userrooms{$id}{'pass'}) )
  ))
) {
  error('パスワードが一致しません');
}

my $dir = "./room/$id/";
my $logs_dir = $set::rooms{$id}{'logs-dir'} || $set::logs_dir;

my $jumpurl = './';
my $filename = $::in{'filename'};
## ログがある場合 
if(-s $dir.'log-all.dat'){
  ## 部屋データ取得
  sysopen(my $FH, $dir.'room.dat', O_RDONLY) or error "room.datが開けません";
  my %roomdata = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  close($FH);

  ## ファイル名チェック
  my $filepath;
  if($filename){
    if($filename !~ /^[-0-9a-zA-Z_.]+$/){ error('ファイル名に使えない文字があります'); }
    $filepath = "${logs_dir}/_$filename" if $::in{'filename'};
  }
  else {
    $filename = getFileNameDate();
    $filepath = "${logs_dir}/_$filename";
  }

  ## ディレクトリチェック／作成
  if(!-d $logs_dir){
    mkdir $logs_dir;
  }
  ## アクセス制限ファイルチェック／作成
  if(!-f "${logs_dir}/.htaccess"){
    sysopen (my $FH, "${logs_dir}/.htaccess", O_WRONLY | O_TRUNC | O_CREAT, 0666);
      print $FH '<Files ~ "\.dat$|config">',"\n";
      print $FH 'deny from all',"\n";
      print $FH '</Files>',"\n";
    close($FH);
  }

  ## 上書き回避
  error('同名のログが存在します') if (-d $filepath || -f "${logs_dir}/$filename.dat"); 

## ログ生成
#sysopen (my $RD, $dir.'log-all.dat', O_RDONLY);
#sysopen (my $WR, $filepath, O_WRONLY | O_TRUNC | O_CREAT, 0666);
#
#my @tabs = @{$set::rooms{$id}{'tab'}};
#my $before_tab;
#my $before_name;
#my $before_color;
#my $before_user;
#my %namecolor;
#print $WR "<h1>$set::rooms{$id}{'name'}</h1>\n";
#while(<$RD>){
#  my ($num, $date, $tab, $name, $color, $comm, $info, $system, $user) = split(/<>/, $_);
#  my $type = ($system =~ /^check|round/) ? 'dice' : ($system) ? $system : 'dice';
#     $type =~ s/:.*?$//;
#  my $game;
#  $user =~ s/<.+?>//;
#  $comm =~ s/<br>/\n/i;
#  print $WR "\nc\{${name}\} = $color\n" if $namecolor{$name} ne $color;
#  print $WR "\n\[$tabs[$tab]\]------------------------------" if $before_tab ne $tab;
#  print $WR "\n${name}:(".($user eq $name ? '' : $user)."):\n" if ($before_tab ne $tab || $before_name  ne $name || $before_color ne $color || $before_user  ne $user);
#  print $WR "$comm\n" if $comm;
#  print $WR "$type>$info\n" if $info;
#  
#  
#  $before_tab   = $tab;
#  $before_name  = $name;
#  $before_color = $namecolor{$name} = $color;
#  $before_user  = $user;
#}
#
#close($WR);
#close($RD);

  my $title = decode('utf8', $::in{'title'}) || $set::rooms{$id}{'name'} || $userrooms{$id}{'name'};
  $title =~ s/</&lt;/g; $title =~ s/>/&gt;/g; $title =~ s/\r\n?|\n//g;
  my @tab;
  foreach (sort {$a <=> $b} keys %{$roomdata{'tab'}}){ push(@tab, $roomdata{'tab'}{$_}); }
  
  my %log_config = (
    'title' => $title,
    'tabs' => [ @tab ],
    'pass' => $userrooms{$id}{'pass'} || '',
    'replaceRule' => { %set::replace_rule },
    'replaceRegex' => [ @set::replace_regex ],
    'replaceHelp' => [ @set::replace_help ],
  );

  #sysopen(my $FH, $dir.'log-all.dat', O_RDWR) or error "log-all.datが開けません";
  #flock($FH, 2);
  #my @lines = <$FH>;
  #unshift(@lines, ">${title}<>".join(',',@tab)."<>${replace_json}\n");
  #seek($FH, 0, 0);
  #print $FH @lines;
  #truncate($FH, tell($FH));
  #close($FH);

  mkdir $filepath;

  use File::Copy 'move';
  use File::Path 'rmtree';
  if(move($dir.'log-all.dat', "$filepath/log.dat")){
    if($::in{'allReset'}){
      rmtree $dir;
    }
  }
  open(my $FH, '>',  "$filepath/config.pl");
  print $FH decode('utf-8', encode_json( \%log_config ));
  close($FH);

  $jumpurl .= '?mode=logs'.($set::rooms{$id}{'logs-dir'} ? "&id=${id}":'')."&log=${filename}";
}
## ログがない場合
else { rmtree $dir; }

## 部屋ごと削除
if($::in{'roomDelete'}){
  my %data;
  sysopen(my $FH, './room/list.dat', O_RDWR) or error "list.datが開けません";
  flock($FH, 2);
  my $text = join('', <$FH>);
  %data = %{ decode_json(encode('utf8', $text)) } if $text;
  seek($FH, 0, 0);

  delete $data{$id};

  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}
print "Content-type:application/json; charset=UTF-8\n\n";
print '{"status":"ok",';
print ' "url":"./'.$jumpurl.'",';
print ' "text":"リセット完了"}';



exit;

1;