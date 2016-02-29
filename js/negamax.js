var evaluate = require("./evaluate");
var gen = require("./gen");
var R = require("./role");
var SCORE = require("./score.js");
var win = require("./win.js");
var math = require("./math.js");
var checkmate = require("./checkmate.js");
var config = require("./config.js");

var MAX = SCORE.FIVE*10;
var MIN = -1*MAX;

var total=0, //总节点数
    steps=0,  //总步数
    count,  //每次思考的节点数
    PVcut,
    ABcut;  //AB剪枝次数

/*
 * max min search
 * white is max, black is min
 */
var maxmin = function(board, deep) {
  var best = MIN;
  var points = gen(board, deep);
  var bestPoints = [];

  count = 0;
  ABcut = 0;
  PVcut = 0;

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = R.com;
    var v = - max(board, deep-1, MIN, (best > MIN ? best : MIN), R.hum);

    //console.log(v, p);
    //如果跟之前的一个好，则把当前位子加入待选位子
    if(math.equal(v, best)) {
      bestPoints.push(p);
    }
    //找到一个更好的分，就把以前存的位子全部清除
    if(math.greatThan(v, best)) {
      best = v;
      bestPoints = [];
      bestPoints.push(p);
    }
    board[p[0]][p[1]] = R.empty;
  }
  console.log("分数:"+best+", 待选节点:"+JSON.stringify(bestPoints));
  var result = bestPoints[Math.floor(bestPoints.length * Math.random())];
  result.score = best;
  steps ++;
  total += count;
  console.log('当前局面分数：' + best);
  console.log('搜索节点数:'+ count+ ',AB剪枝次数:'+ABcut + ', PV剪枝次数:' + PVcut); //注意，减掉的节点数实际远远不止 ABcut 个，因为减掉的节点的子节点都没算进去。实际 4W个节点的时候，剪掉了大概 16W个节点
  console.log('当前统计：总共'+ steps + '步, ' + total + '个节点, 平均每一步' + Math.round(total/steps) +'个节点');
  console.log("================================");
  return result;
}

var max = function(board, deep, alpha, beta, role) {
  var v = evaluate(board);
  count ++;
  if(deep <= 0 || win(board)) {
    return v;
  }
  
  var best = MIN;
  var points = gen(board, deep);

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = role;
    
    var v = - max(board, deep-1, -beta, -1 *( best > alpha ? best : alpha), R.reverse(role)) * config.deepDecrease;
    board[p[0]][p[1]] = R.empty;
    if(math.greatThan(v, best)) {
      best = v;
    }
    if(math.greatOrEqualThan(v, beta)) { //AB 剪枝
      ABcut ++;
      return v;
    }
  }
  if( (deep <= 2 )
     && role == R.com
     && math.littleThan(best, SCORE.THREE*2) && math.greatThan(best, SCORE.FOUR * -1)
    ) {
    var mate = checkmate(board, R.com);
    if(mate) {
      return SCORE.FIVE * Math.pow(.8, mate.length);
    }
  }
  return best;
}

var deeping = function(board, deep) {
  deep = deep === undefined ? config.searchDeep : deep;
  //迭代加深
  //注意这里不要比较分数的大小，因为深度越低算出来的分数越不靠谱，所以不能比较大小，而是是最高层的搜索分数为准
  var result;
  for(var i=2;i<=deep; i+=2) {
    result = maxmin(board, i);
    if(math.greatOrEqualThan(result.score, SCORE.FOUR)) return result;
  }
  return result;
}
module.exports = deeping;
