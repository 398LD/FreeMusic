//播放队列
var playlist = [];
//当前部分序列
var playindex = 0;

var lrcarr = [];

$(function() {
	//加载音乐
	loadList();
	init(0);
	$("#audio").on("timeupdate", function() {
		var currentTime = getTime(parseInt($("#audio")[0].currentTime));

		var lrc = getLrc(currentTime);
		//总时长
		var duration = $("#audio")[0].duration;

		$("#currentTime").text(currentTime);
		$("#duration").text(getTime(parseInt(duration)));
		var bfb = ($("#audio")[0].currentTime / duration) * 93;
		$(".jdt-line-in").css("width", bfb + "%");
		if(lrc != -1) {
			$("#lrc li").css("color", "black")
			$("#lrc li").css("font-size", "16px")
			$("#lrc li").eq(lrc).css("color", "#00c5a0")
			$("#lrc li").eq(lrc).css("font-size", "18px")
			if(lrc > 7) {
				// 如果下一句是空
				var top = (240 - (parseInt(lrc) * 30));
				$("#lrc").css("transform", "translateY(" + top + "px)");
			}
		}

	})

	$("#audio").on("ended", function() {
		playindex++;
		if(playindex >= playlist.length) {
			//到最后一条了 从新开始
			playindex = 0;
		}
		play(playindex);
	})

	//查询随机推荐的音乐
	$.get(server + "/search/random", function(data) {
		$("#randomtui").text("");
		$.each(JSON.parse(data), function(index, item) {

			$("#randomtui").append("<div onclick='join(this)' data='" + JSON.stringify(item) + "' class='col-xs-4'><img src='" + item.photourl + "'><p>" + sub(item.songname, 7) + "</p></div>");
		});

	});

	$.get(server + "/search/top", function(data) {
		$("#top").text("");
		$.each(JSON.parse(data), function(index, item) {
			$("#top").append("<div  onclick='join(this)' data='" + JSON.stringify(item) + "' class='music-item'><div class='col-xs-2'><img src='" + item.photourl + "' /></div><div class='col-xs-8'><div class='music-title'>" + sub(item.songname, 7) + "</div><div class='music-gs'>" + item.singer + "</div></div><div class='col-xs-2 music-play'><span class=' glyphicon glyphicon-play-circle '></span></div></div>");
		});

	})

})

//加入到队列
function join(obj) {
	var data = JSON.parse($(obj).attr("data"));
	var songid = data.songid;
	var playlist = JSON.parse(localStorage.getItem("playlist"));
	$.each(playlist, function(index, item) {
		if(songid == item.songid) {
			playlist.splice(index, 1);
			return false;
		}
	});
	playlist.push(data);
	localStorage.setItem("playlist", JSON.stringify(playlist));
	//重新加载
	loadList();
	playindex = 0;
	play(playindex);

}

function remove(index) {
	playlist.splice(index, 1);
	localStorage.setItem("playlist", JSON.stringify(playlist.reverse()));
	loadList();
	if(index == playindex) {
		play(playindex - 1);
	}

	if(index < playindex) {
		playindex--;
		$($(".list-table>tr").eq(playindex).children("td").get(0)).css("color", "#00c5a0");
	}

	if(index > playindex) {
		$($(".list-table>tr").eq(playindex).children("td").get(0)).css("color", "#00c5a0");
	}

}

$(".jdt-line").click(function(e) {
	// 当前进度条宽度
	var w = e.pageX - $(".jdt-line").offset().left;

	// 计算百分比
	var bfb = w / ($(".jdt-line").width());

	$("#audio")[0].currentTime = $("#audio")[0].duration * bfb;

	$(".jdt-line-in").width((bfb * 100) + "%")
})

function getLrc(time) {
	for(var i = 0; i < lrcarr.length; i++) {
		var lrc = lrcarr[i];
		var lrcTime = lrc.substring(lrc.indexOf("[") + 1, lrc.indexOf("."));
		if(time == lrcTime) {
			return i;
		}
	}
	return -1;
}

//加载播放队列
function loadList() {
	if(localStorage.getItem("playlist") != undefined) {
		playlist = JSON.parse(localStorage.getItem("playlist")).reverse();

		if(playlist.length <= 0) {
			$("#list-table").html("<tr><td colsapn=2>播放队列暂无音乐,赶快去添加吧!</td></tr>");
		} else {
			$("#list-table").text("");
			$.each(playlist, function(index, music) {
				$("#list-table").append("<tr class='playmusic' >" +
					"<td width=\"80%\" onclick=\"play(" + index + ")\" >" + sub(music.songname + " - " + music.singer, 17) + "</td>" +
					"<td width=\"10%\" style='padding-left: 10px;'  onclick=\"remove(" + index + ")\">" +
					"	<span class=\"glyphicon glyphicon-trash \"></span>" +
					"</td>" +
					"<td width=\"10%\" style='padding-left: 10px;' onclick=\"down(" + index + ")\">" +
					"	<span class=\"glyphicon glyphicon-download-alt\"></span>" +
					"</td>" +
					"</tr>");

			});
		}
	} else {
		localStorage.setItem("playlist", "[]")
	}

}

function down(index) {
	var music = playlist[index];
	var playurl = getPlayUrl(music.songmid);
	var songname = music.songname;
	var singer = music.singer;
	window.location.href = server + "/search/download?playurl=" + encodeURIComponent(playurl) + "&fileName=" + songname + "-" + singer;
}

function getTime(s) {
	var ss = 0;
	var mm = 0;
	if(s >= 60) {

		if(s % 60 == 0) {
			ss = 0;
			mm = s / 60;
		} else {
			mm = parseInt(s / 60);
			ss = s - mm * 60;
		}
	} else {
		ss = s;
		mm = 0;
	}

	if(mm < 10) {
		mm = "0" + mm;
	}
	if(ss < 10) {
		ss = "0" + ss;
	}
	if(s == NaN) {
		ss = "00";
	}

	return mm + ":" + ss;

}

function sub(str, max) {
	if(str.length >= max) {
		return str.substring(0, max - 1) + "..";
	} else {
		return str;
	}
}

function init(index) {
	//队列有歌曲才做处理
	if(playlist.length > 0) {
		playindex = index;
		var music = playlist[index];
		//初始化歌曲信息
		var playurl = getPlayUrl(music.songmid);
		console.log(playurl)
		$("#audio").attr("src", playurl);
		$("#play-img").attr("src", music.photourl);
		$(".music-name").text(sub(music.songname, 14));
		$("#music-singer").text(sub(music.singer, 7));

		//获取歌词
		$.get(server + "/search/getlrcArr?songid=" + music.songid, function(data) {
			$("#lrc").text("");
			//清空数组
			lrcarr = [];
			//清除所有空行
			if(data.length == 0) {
				$("#lrc").append("<li>此歌曲暂时无法为您提供歌词</li>")
			} else {
				$.each(data, function(index, item) {
					var lrc = item.substring(item.indexOf("]") + 1, item.length)
					if(lrc.trim().length > 0) {
						lrcarr.push(item);
						$("#lrc").append("<li>" + lrc + "&nbsp;</li>")
					}
				});
			}

		})
	}

}

var isPlay = false;

//播放
function play(index) {
	init(index);
	//开始旋转
	$("#lrc").css("transform", "translateY(0px)");
	$("#play-img").css("animation-play-state", "running");
	$(".play>span").attr("class", "glyphicon glyphicon-pause");
	$("#play2").attr("class", "glyphicon glyphicon-pause");

	$(".list-table>tr>td").css("color", "black");
	$($(".list-table>tr").eq(playindex).children("td").get(0)).css("color", "#00c5a0");

	/*播放*/
	$("#audio")[0].play();
	isPlay = true;
}

//暂停
function pause() {
	$(".play>span").attr("class", "glyphicon glyphicon-play");
	$("#play2").attr("class", "glyphicon glyphicon-play");
	$("#play-img").css("animation-play-state", "paused");
	$("#audio")[0].pause();
}

//下一曲
$("#next").click(function() {
	playindex++;
	if(playindex >= playlist.length) {
		//到最后一条了 从新开始
		playindex = 0;
	}
	play(playindex);

});

//上一曲

$("#last").click(function() {
	playindex--;
	if(playindex <= 0) {
		//到最后一条了 从新开始
		playindex = 0;
	}
	play(playindex);

});

$(".play,#play2").click(function() {
	if(isPlay) {
		pause();
	} else {
		$("#audio")[0].play();
		$("#play-img").css("animation-play-state", "running");
		$(".play>span").attr("class", "glyphicon glyphicon-pause");
		$("#play2").attr("class", "glyphicon glyphicon-pause");
		$(".list-table>tr>td").css("color", "black");
		$($(".list-table>tr").eq(playindex).children("td").get(0)).css("color", "#00c5a0");
	}
	isPlay = !isPlay
})

//打开搜索界面
$(".search>span").click(function() {
	$("body").css("overflow", "hidden");
	$(".search-page").css("left", 0);
})

//关闭搜索界面

$(".search-top-close").click(function() {
	$("body").css("overflow", "auto");
	$(".search-page").css("left", 5000);
})

//点击搜索
$("#search-btn").click(function() {
	var search = $("#search").val();
	if(search.trim().length <= 0) {
		alert("请输入关键字搜索");
	} else {
		$.ajax({
			type: "get",
			url: server + "/search/music?musicName=" + search,
			async: true,
			beforeSend: function() {
				$("#search-btn").attr("disabled", true);
				$("#search-btn").text("加载中..");
				loading.showLoading({
					type: 5,
					tip: "加载中.."
				})
			},
			success: function(data) {
				$("#search-list").scrollTop(0)
				$("#search-btn").attr("disabled", false);
				$("#search-btn").text("搜索");
				loading.hideLoading();
				$("#search-list").text("");
				if(data.length == 0) {
					$("#search-list").text("未找到相关歌曲,请换个关键词试试");
				} else {

					$.each(JSON.parse(data), function(index, item) {
						$("#search-list").append("<div  onclick='join(this)' data='" + JSON.stringify(item) + "' class='search-item'><div class='col-xs-10'><div class='search-song'>" + sub(item.songname, 14) + "</div><div class='search-singer'>" + sub(item.singer, 7) + "</div></div><div class='col-xs-2 search-play'><span class='glyphicon glyphicon-play-circle'></span></div></div>")
					});
				}

			}
		});

	}
})

function getPlayUrl(songmid) {
	var result;
	$.ajax({
		type: "get",
		url: server + "/search/playurl?songmid=" + songmid,
		async: false,
		success: function(data) {
			result = data;

		},
		error: function() {
			console.log("获取播放地址失败");
		}
	});
	return result;

}

$("#play-img").click(function() {
	$("body").css("overflow-y", "hidden")
	$("#play").css("top", 0);
});
$("#close").click(function() {
	$("body").css("overflow-y", "auto")
	$("#play").css("top", 5000);
});

$("#music-list").click(function() {

	$("body").css("overflow-y", "hidden")
	$("#play").css("overflow-y", "hidden")
	$(".list").css("top", 0);
	//				$(".list").css("top", 0);
	$(".music-list").css("top", 300)
});

$("#list").click(function() {

	$("body").css("overflow-y", "hidden")
	$("#play").css("overflow-y", "hidden")
	$(".list").css("top", 0);
	$(".music-list").css("top", 300)
});
$("#close-list").click(function() {
	$("body").css("overflow-y", "auto")
	$("#play").css("overflow-y", "auto")
	$(".list").css("top", 5000);
	$(".music-list").css("top", 5000)
});