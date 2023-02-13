################## データ保存 ##################
use strict;
#use warnings;
use utf8;
use open ":utf8";
use LWP::UserAgent;
use JSON::PP;

sub dataGet {
  my $url = shift;
  my $ua  = LWP::UserAgent->new;
  my $res = $ua->get($url);
  if ($res->is_success) {
    return $res->decoded_content;
  }
  else {
    return undef;
  }
}

sub dataConvert {
  my $set_url = shift;
  
  {
    my $sheetHtml = dataGet($set_url) or error 'URLを開けませんでした';
    my $bodyUrl;
    if ($sheetHtml =~ /\<link\s+rel=\"ytchat-body-exporting-point\"\s+type=\"[a-z0-9\/]+\"\s+href=\"(.+?)\"\s*\/?\>/) {
      $bodyUrl = $1;
      if (substr($bodyUrl, 0, 1) eq '.') {
        my $relation = $bodyUrl;
        $bodyUrl = $set_url;
        $bodyUrl =~ s/\?.+$/$relation/;
      }
    } else {
      error('ステータスの取得できる参照先ではありません');
    }
    my $paletteUrl;
    if ($sheetHtml =~ /\<link\s+rel=\"ytchat-palette-exporting-point\"\s+type=\"[a-z0-9\/]+\"\s+href=\"(.+?)\"\s*\/?\>/) {
      $paletteUrl = $1;
      if (substr($paletteUrl, 0, 1) eq '.') {
        my $relation = $paletteUrl;
        $paletteUrl = $set_url;
        $paletteUrl =~ s/\?.+$/$relation/;
      }
    } else {
      $paletteUrl = '';
    }
    my $data = dataGet($bodyUrl) or error 'JSONのURLを開けませんでした';
    my $json;
    eval { $json = decode_json(join '', $data); };
    if ($@) { error('JSONの形式が不正です'); }
    my %pc = %{ $json };
    error('有効なキャラクターシートではありません') if !$pc{'ver'};
    my %stt;
    my @stt_name;
    my $memo;
    my $result;
    my $game = $::in{'game'};
    if($pc{'unitStatus'}){
      foreach my $data (@{$pc{'unitStatus'}}){
        if($data eq '|'){
          $result .= '<br>';
        }
        else {
          my $key = (keys %{$data})[0];
          if($key =~ /^(memo|メモ)$/){
            $memo = $data->{$key};
          }
          else {
            push(@stt_name, $key);
            $stt{$key} = $data->{$key};
          }
          $result .= "<b>$key</b>:$data->{$key}　";
        }
      }
    }
    if($::in{'status'}){
      my %except = {};
      %except = %{$pc{'unitExceptStatus'}} if $pc{'unitExceptStatus'};
      foreach my $label (split(' &lt;&gt; ', $::in{'status'})){
        next if($except{$label});
        push(@stt_name, $label);
      }
      if($::in{'statusDefault'}){
        foreach my $data (split(' &lt;&gt; ', $::in{'statusDefault'})){
          my ($label, $value) = split(/[:：]/, $data, 2);
          $stt{$label} ||= $value || '';
        }
      }
    }
    @stt_name = do { my %c; grep {!$c{$_}++} @stt_name }; # 重複削除
    # 名前
    my $aka  = rubyConvert( $pc{'aka'} );
    my $name = rubyConvert( $pc{'characterName'} || $pc{'monsterName'} );
    # プロフィール
    my $profile = textConvert($pc{'sheetDescriptionM'});
    # 画像
    my $img;
    if($pc{'image'}){
      my $fit = $pc{'imageFit'};
      if   ($fit eq 'percentY')   { $fit = 'auto '.$pc{'imagePercent'}*1.3 .'%'; }
      elsif($fit =~ /^percentX?$/){ $fit =         $pc{'imagePercent'}*1.3 .'%'; }
      $fit = "background-size:$fit;" if $fit;
      my $position = "background-position:$pc{imagePositionX}% $pc{imagePositionY}%;";
      $img = "<div class=\"chara-image\" style=\"background:url($pc{'imageURL'});${fit}${position}\"></div>";
    }
    $result = ($img || '')
            . "<a href=\"${set_url}\" target=\"_blank\">".($aka?"“$aka”":'')."$name</a><br>"
            . ($profile ? $profile.'<br>':'')
            . $result;
    # チャットパレット取得
    my $palette = $paletteUrl ? dataGet($paletteUrl) || '' : '';
    # 最終
    my %data = (
      'url' => $set_url,
      'status' => \%stt,
      'sttnames' => \@stt_name,
      'memo' => ($memo || ''),
      'palette' => $palette,
    );
    return (\%data, $result);
  }
}
sub rubyConvert {
  my ($text, $ruby) = split(':', shift);
  if($ruby){
    return "<ruby>$text<rt>$ruby</rt></ruby>";
  }
  else {
    $text =~ s#[|｜](.+?)《(.+?)》#<ruby>$1<rt>$2</rt></ruby>#g;
    return $text;
  }
}
sub textConvert {
  my $text = shift;
  $text =~ s#[|｜](.+?)《(.+?)》#<ruby>$1<rt>$2</rt></ruby>#g;
  $text =~ s/&lt;br&gt;|\n/<br>/gi;
  return $text;
}
sub numConvert {
  my $text = shift;
  if($text =~ /^[0-9]+$/ && $text > 0) {
    return "$text/$text";
  }
  elsif($text =~ /^[\-ー－―×]$/){
    return "";
  }
  else { return $text; }
}

## タグ：全角スペース・英数を半角に変換 --------------------------------------------------
sub convertTags {
  my $tags = shift;
  $tags =~ tr/　/ /;
  $tags =~ tr/０-９Ａ-Ｚａ-ｚ/0-9A-Za-z/;
  $tags =~ tr/＋－＊／．，＿/\+\-\*\/\.,_/;
  $tags =~ tr/ / /s;
  return $tags
}

1;