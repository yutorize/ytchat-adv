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
my %rooms = getRoomList();

###################
### 部屋の有無をチェック
my $error_flag = (!exists($rooms{$id}) && !$::in{'log'}) ? 1 : 0;

my $logs_dir = ($id && $rooms{$id}{'logs-dir'}) ? $rooms{$id}{'logs-dir'} : $set::logs_dir;
my $is_isolated = !($logs_dir eq $set::logs_dir);
my $room_name = $is_isolated ? $rooms{$id}{'name'} : '';

my @tabs = $id ? ($rooms{$id}{'tab'} ? @{$rooms{$id}{'tab'}} : ('メイン','サブ')) : ();

###################
### テンプレート読み込み
my $ROOM;
$ROOM = HTML::Template->new(
  filename => './lib/html/logs'.($::in{'type'} eq 'simple' ? '-simple' : '').'.html',
  utf8 => 1,
  loop_context_vars => 1,
  die_on_bad_params => 0,
  die_on_missing_include => 0,
  case_sensitive => 1,
  global_vars => 1
);

###################
### ログ本体

$ROOM->param(ver => $::ver);

$ROOM->param(roomId => $id);
$ROOM->param(isPresent => !$::in{'log'} ? 1 : 0);
$ROOM->param(title => $rooms{$id}{'name'});
$ROOM->param(subtitle => $::in{'log'}?$::in{'log'}:'現行ログ');

$ROOM->param(liteMode => ($::in{'type'} eq 'lite') ? 1 : 0);
$ROOM->param(dlMode => ($::in{'type'} eq 'download') ? 1 : 0);

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
      $ROOM->param(title => $logconfig{'title'});
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

# my $size_limit_over;
# if(-s $logfile > 1024*512){
#   $size_limit_over = 1;
#   if(!$::in{'type'} && !$::in{'page'}){
#     $ROOM->param(liteMode => 1);
#   }
# }

my @logs;
my $before_tab;
my $before_name;
my $before_color;
my $before_user;
my $before_address;
my @bgms; my %bgms;
my @bgis; my %bgis;
my @sheet_names; my %sheets;
my %stat;
my %stat_count;
my %user_color;
my $tagconvert_on = %logconfig ? 1 : $::in{"log"} ? 0 : 1;

sysopen (my $FH, $logfile, O_RDONLY) or $error_flag = 1;
foreach (<$FH>){
  chomp;
  if($_ =~ s/^>//) {
    my ($name, $tab) = split(/<>/, $_);
    $ROOM->param(title => $name);
    @tabs = split(',', $tab);
    next;
  }
  
  my ($num, $date, $tab, $name, $color, $comm, $info, $system, $user, $address) = split(/<>/, $_);
  $color = '' if $color eq 'undefined' || $color eq 'null';
  $color =~ s/^#{2,}/#/;
  my $userid;
  $user =~ s/<(.+?)>$/$userid = $1; '';/e;
  $user_color{$name} = $color;
  
  my $openlater;
  if($address){
    if($address =~ s/\#$//){ $openlater = '#'; } #青秘話=#
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
  
  $comm = tagConvert($comm) if $tagconvert_on; #文字装飾
  $comm =~ s#<h([1-6])>(.+?)</h\1>#<h$1 data-headline="$1">$2</h$1>#ig;

  if($system =~ /^palette$/){
    next;
  }
  elsif($system =~ /^ready-/){
    next;
  }
  elsif($system =~ /^image$/){
    $info = '<img loading="lazy" src="' . $info . '">';
  }
  elsif($system =~ /^bgm:([0-9]+):(.+)$/){
    my ($url, $vol) = ($2, $1);
    $comm = '<span class="bgm-border" data-url="'.$url.'" data-title="'.$info.'" data-vol="'.$vol.'"></span>'.$comm;
    if(!$bgms{$url}){ push(@bgms, $url) }
    $bgms{$url} = ' <a class="link-yt" href="'.$url.'" target="_blank">'.$info.'</a>';
    $info .= "<small>${vol}％</small>";
    if($url =~ /^https:\/\/youtu\.be\/.+$/){ $info .= ' <a class="link-yt" href="'.$url.'" target="_blank"></a>' }
  }
  elsif($system =~ /^bgm$/){
    $comm = '<span class="bgm-border"></span>'.$comm;
  }
  elsif($system =~ /^bg:(?:(resize|tiling):)?(.+)$/){
    $comm = '<span class="bg-border" data-mode="'.$1.'" data-url="'.$2.'" data-title="'.$info.'"></span>'.$comm;
    if(!$bgis{$1}){ push(@bgis, $1) }
    $bgis{$1} = $info;
  }
  elsif($system =~ /^bg$/){
    $comm = '<span class="bg-border"></span>'.$comm;
  }
  elsif($system =~ /^round:(.+?)$/){
    if($1){
      $comm = '<span data-headline="4">ラウンド: '.$1.'</span>';
      $info = '';
    }
  }
  elsif($system =~ /^tab:([0-9]+)=(.*?)$/){
    if($2){ $tabs[$1-1] = "$2"; }
  }
  elsif($system =~ /^unit:.*(?:\(|\|\s+)url>(http.+?)(?:\)|\s+\|)/) {
    my $sheetUrl = $1;
    my $unitName = $info =~ /\[{2}(.+?)>https?.+]{2}/ ? $1 : $name;

    if (!$sheets{$unitName}) {
      push(@sheet_names, $unitName);
      $sheets{$unitName} = $sheetUrl;
    }
  }

  if(!$tabs[$tab-1]){ $tabs[$tab-1] = "タブ${tab}"; }
  
  my $type = ($system =~ /^(check|dice)/) ? 'dice' : $system;
     $type .= ' choice' if ($system =~ /^deck/);
     $type =~ s/:.*?$//;
  my $game = ($system =~ /^dice:(.*)$/) ? $1 : '';
  my $code;
  my @infos = split(/<br>/,$info);
  foreach (@infos){
    { $_ =~ s/\<\<(.*)$//; $code = $1; }
    if($system =~ /^dice/){
      #出目統計
      diceStat($game,$user,$_);
      # 成形
      $_ =~ s#(\[.*?\])#<i>$1</i>#g;
      $_ =~ s# = ([0-9a-z.∞]+)$# = <strong>$1</strong>#gi;
      $_ =~ s# = ([0-9a-z.∞]+)# = <b>$1</b>#gi;
      $_ =~ s# → ((?:成功|(?:自動)?失敗|／)+)$#" → ".stylizeSuccessAndFailure($1)#gie;
      #クリティカルをグラデにする
      my $crit = $_ =~ s/(クリティカル!\])/$1<em>/g;
      while($crit > 0){ $_ .= "</em>"; $crit--; }
      $_ =~ s#\[([0-9,]+?)!!]#<em>[$1]</em>#g;
      #ファンブル用の色適用
      if($_ =~ /1ゾロ|ファンブル/){ $_ = "<em class='fail'>$_</em>"; }
      $_ =~ s#\[([0-9,]+?)\.\.\.\]#<em class='fail'>[$1]</em>#g;
      #
      $_ =~ s#\{(.*?)\}#{<span class='division'>$1</span>}#g;
    }
    elsif($system eq 'choice') {
      if($_ =~ s#(\(.+\) → )(.+?)$#$1#){
        foreach my $result (split ",", $2) {
          $_ .= "<i class='result'>$result</i>";
        }
      }
    }
    elsif($system =~ /^unit/){
      if(1){
        my $dices = $_;
        if($dices =~ /^[0-9]+D10→([0-9,]+)\s/){
          foreach (split(',',$1)){
            $stat_count{'D10'}++;
            $stat{$user}{'D10'}{'single'}{$_}++;
          }
        }
      }
      $_ =~ s# (\[.*?\])# <i>$1</i>#g;
    }
  }
  $info = join('<br>', @infos);

  if($system =~ /^(choice:list|deck)/){
    $info =~ s#\[(.*?)\](?=\[|<br>|$)#<b class='result'>$1</b>#g;
  }
  elsif($system =~ /^(choice:table)/){
    $info =~ s#(?<=:) \[(.*?)\](?=.+? → |$)#<b class='result'>$1</b>#g;
  }

  $info = tagConvert($info) if $tagconvert_on && $system =~ /^(topic|memo|choice|deck)/; #文字装飾
  $info = tagConvertUnit($info) if $tagconvert_on && $system =~ /^(unit)/;

  $comm =~ s#(―+)#<span class="dash">$1</span>#g;
  $info =~ s#(―+)#<span class="dash">$1</span>#g;
  
  if($system =~ /^rewrite:([0-9]+)$/){
    my $target = $1;
    foreach my $data (@logs){
      foreach my $line (@{ $data->{'LogsDD'} }){
        if($line->{'NUM'} eq $target){ $line->{'COMM'} = $comm.'<span class="rewrited"></span>'; }
      }
    }
    next;
  }
  elsif($system =~ /^rewritename:([0-9]+)$/){
    my $target = $1;
    foreach my $data (@logs){
      if($data->{'NUM'} eq $target){
        if($data->{'CLASS'} =~ 'secret'){
          $data->{'NAME'} =~ s/^.* > (.+?)$/$name > $1/;
        }
        else {
          $data->{'NAME'} = $name;
        }
        $data->{'COLOR'} = $color;
      }
    }
    next;
  }

  if($system =~ /^memo/ && $info){ $info = '<details open><summary>詳細</summary>'.$info.'</details>'; }
  
  my $class  = ($name eq '!SYSTEM') ? 'system '    : '';
     $class .= ($system =~ /^(topic|memo|bgm?|ready|round|enter|exit)/) ? "$1 " : '';
     $class .= $address   ? 'secret '    : '';
     $class .= $openlater ? 'openlater ' : '';
     $class .= $tab == 1 ? 'main ' : '';
  
  if ( $before_tab     ne $tab
    || $before_name    ne $name
    || $before_color   ne $color
    || $before_user    ne $user
    || $before_address ne $address.$openlater
    || ($name eq '!SYSTEM')
  ){
    push(@logs, {
      "NUM"    => $num,
      "TAB"    => $tab,
      "TABNAME"=> $tabs[$tab-1],
      "USER"   => $user,
      "NAME"   => $name,
      "COLOR"  => $color,
      "CLASS" => $class,
      "LogsDD" => [],
      "BORDER" => ((scalar(@logs)+1) % 1000 == 0 ? 1 : 0),
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
  $before_address  = $address.$openlater;
}
close($FH);

$ROOM->param(Logs => \@logs);

my @bgm_list;
my @bgi_list;
push(@bgm_list,{ "TITLE"  => $bgms{$_} }) foreach @bgms;
push(@bgi_list,{ "TITLE"  => $bgis{$_} }) foreach @bgis;
$ROOM->param(BgmList => \@bgm_list);
$ROOM->param(BgiList => \@bgi_list);

my @sheet_list;
push(@sheet_list,{ 'NAME' => $_, 'URL' => $sheets{$_} }) foreach @sheet_names;
$ROOM->param(SheetList => \@sheet_list);

## 出目統計
{
  my $user_stat_dice;
  my $stat_game = $stat_count{'D10'} > $stat_count{'2D6'} ? 'D10' : '2D6';
  my $stat_type = $stat_game eq '2D6' ? 'total' : 'single';
  my %stat_nums = (
    '2D6' => [2..12],
    'D10' => [1..10],
  );
  foreach my $name (sort keys %stat){
    my $c = 0; my $t = 0; my $max = 0;
    my $cell1; my $cell2;
    foreach(@{$stat_nums{$stat_game}}){
      my $n = $stat{$name}{$stat_game}{$stat_type}{$_};
      $c += $n;
      $t += $_ * $n;
      $max = $n if ($n > $max);
    }
    next if !$c;
    my $coefficient = 100 / ($max / $c * 100);
    foreach(@{$stat_nums{$stat_game}}){
      my $per = sprintf("%.1f", $stat{$name}{$stat_game}{$stat_type}{$_} / $c * 100);
      $cell1 .= '<td><i style="height:'.($per * $coefficient).'px;"></i></td>';
      $cell2 .= "<td>$stat{$name}{$stat_game}{$stat_type}{$_}<small>$per\%</small></td>";
    }
    $cell1 .= '<td></td><td></td>';
    $cell2 .= '<td>'.$c.'回</td><td>'.sprintf("%.2f", $t / $c).'</td>';
    $user_stat_dice .= "<tr class=\"stat-graf-row\"><th rowspan=\"2\" style=\"color:$user_color{$name}\">$name</th>$cell1</tr><tr>$cell2</tr>";
  }
  my $thead;
  foreach (@{$stat_nums{$stat_game}}){
    $thead .= "<th>$_</th>";
  }
  $thead = "<thead><th></th>$thead<th>合計</th><th>平均</th></thead><tfoot><th></th>$thead<th>合計</th><th>平均</th></tfoot>";
  $ROOM->param(statDice => "<table class=\"stat-table stat-dice code-$stat_game\">${thead}${user_stat_dice}</table>") if $user_stat_dice;
}

###################
### タブ一覧
my @tablist;
foreach my $num (0 .. $#tabs){
  push(@tablist, {'NUM' => $num+1, 'NAME' => $tabs[$num]});
}
$ROOM->param(TabList => \@tablist);

###################
### 部屋一覧
if($opt{'roomList'}){
  my @roomlist;
  foreach my $i (sort keys %rooms){
    next if $i eq '';
    next if ($rooms{$i}{'secret'} && $id ne $i);
    next if $rooms{$i}{'name'} eq '';
    my $byte = int( (stat("room/${i}/log-all.dat"))[7] / 1024 + 0.5);
    my $current = ($i eq $id && !$::in{'log'}) ? 1 : 0;
    push(@roomlist, {'ID' => $i, 'NAME' => $rooms{$i}{'name'}, 'BYTE' => $byte, 'CURRENT' => $current});
  }
  $ROOM->param(RoomList => \@roomlist);
  $ROOM->param(roomListOpen => !$::in{'log'} ? 'open' : '');
}
###################
### 過去ログ一覧
if($opt{'logList'}){
  my $dir = $logs_dir;
     $dir =~ s|/$||;
  # ログ名前一覧
  my %log_name;
  if(!-f "${dir}/_log-names.dat"){ logNameFileCreate($dir); }
  open(my $FH, '<',  "${dir}/_log-names.dat");
  foreach(<$FH>){
    chomp;
    my ($file, $name) = split('<>', $_);
    $log_name{$file} = $name;
  }
  close($FH);

  # ログ一覧
  opendir(my $DIR, $dir);
  my @filelist = readdir($DIR);
  closedir($DIR);
  my @loglist;
  foreach(reverse sort @filelist) {
    if ($_ =~ /^_log-names\.dat$/) {}
    elsif ($_ =~ /\.dat$/) {
      my $byte = int( (stat("$dir/$_"))[7] / 1024 + 0.5);
      my $file = $_;
         $file =~ s/\..+?$//;
      my $name = $set::list_log_name_view ? $log_name{$file} : '';
      my $current = ($file eq $::in{'log'}) ? 1 : 0;
      push(@loglist, {'NAME' => $name, 'FILE' => $file, 'BYTE' => $byte, 'CURRENT' => $current,});
    }
    elsif ($_ =~ /^_.+?(?!.dat)$/) {
      my $byte = int( (stat("$dir/$_/log.dat"))[7] / 1024 + 0.5);
      my $file = $_;
         $file =~ s/^_//;
      my $name = $set::list_log_name_view ? $log_name{$file} : '';
      my $current = ($file eq $::in{'log'}) ? 1 : 0;
      push(@loglist, {'NAME' => $name, 'FILE' => $file, 'BYTE' => $byte, 'CURRENT' => $current,});
    }
  }
  $ROOM->param(LogList => \@loglist);
  $ROOM->param(idDir => $id) if($id && $rooms{$id}{'logs-dir'});
  $ROOM->param(logListOpen => $::in{'log'} ? 'open' : '');
  $ROOM->param(isIsolated => $is_isolated);
  $ROOM->param(roomName => $room_name);
}


###################
### エラー
if($error_flag){
  if($::in{'id'} || $::in{'log'}) {
    $ROOM->param(title => 'NO DATA');
    $ROOM->param(subtitle => '');
    $ROOM->param(Logs => \@{[{
      "NAME"   => 'SYSTEM',
      "USER"   => 'system',
      "CLASS" => 'main',
      "LogsDD" => [{
        "COMM"  => '該当するルーム、またはログがありません。',
      }]
    }]});
  }
  else {
    $ROOM->param(title => 'ゆとチャadv.');
    $ROOM->param(subtitle => 'ログビューアー');
    $ROOM->param(Logs => \@{[{
      "NAME"   => 'SYSTEM',
      "USER"   => 'system',
      "CLASS" => 'main',
      "LogsDD" => [{
        "COMM"  => 'ログが選択されていません。<br>メニューから任意のルーム／ログを選択してください。',
      }]
    }]});
    $ROOM->param(roomListOpen => '');
    $ROOM->param(logListOpen => '');
  }
}

###################
### CSS
$ROOM->param(customCSS => $set::custom_css);

###################
### 出力
return $ROOM->output;


###################
### サブルーチン
sub diceStat {
  my $game  = shift;
  my $user  = shift;
  my $dices = shift;
  #出目統計
  if($dices =~ /^2D6 /){
    if($dices =~ /([0-9]+)\[([0-9,]+)(.+?)?\]/){
      $stat_count{'2D6'}++;
      $stat{$user}{'2D6'}{'total'}{$1}++;
      $stat{$user}{'2D6'}{'combo'}{$2}++;
      foreach (split(',',$2)){
        $stat{$user}{'2D6'}{'single'}{$_}++;
      }
    }
  }
  elsif($game eq 'sw'){
    while($dices =~ s/\[([0-9]+)\+([0-9]+)=([0-9]+)(.+?)?\]//){
      $stat_count{'2D6'}++;
      $stat{$user}{'2D6'}{'total'}{$3}++;
      $stat{$user}{'2D6'}{'combo'}{"$1,$2"}++;
      $stat{$user}{'2D6'}{'single'}{$1}++;
      $stat{$user}{'2D6'}{'single'}{$2}++;
    }
  }
  elsif($dices =~ /^[0-9]+D10 /){
    if($dices =~ /[0-9]+\[([0-9,]+)(.+?)?\]/){
      foreach (split(',',$1)){
        $stat_count{'D10'}++;
        $stat{$user}{'D10'}{'single'}{$_}++;
      }
    }
  }
  elsif($game eq 'dx'){
    while($dices =~ s/[0-9]+\[([0-9,]+)(.+?)?\]//){
      foreach (split(',',$1)){
        $stat_count{'D10'}++;
        $stat{$user}{'D10'}{'single'}{$_}++;
      }
    }
  }
}

###################

}

1;