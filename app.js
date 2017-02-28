var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});


var room_id=0;
var wait = 0;
var maps=[];


function init_map(){
	
	var map=Array(10);
	for(var i=0;i<10;i++){
		map[i]=Array(9);
		for(var j=0;j<9;j++)
				map[i][j]=0;
	}
		
	map[0]=[2,3,4,5,6,5,4,3,2];
	map[9]=[12,13,14,15,16,15,14,13,12];
	map[2][1]=map[2][7]=1;
	map[7][1]=map[7][7]=11;
	map[3][0]=map[3][2]=map[3][4]=map[3][6]=map[3][8]=7;
	map[6][0]=map[6][2]=map[6][4]=map[6][6]=map[6][8]=17;
	return map;
}

function find_val(id,val){
	for(var i=0;i<10;i++)
		for(var j=0;j<9;j++)
			if(maps[id][i][j]==val)
				return [i,j];
	return false;
}

function legal_move(id,val,x,y,o_x,o_y){
	ans=false;
	if(maps[id][y][x]!=0&&maps[id][y][x]<10&&val<10) return false;
	if(maps[id][y][x]>10&&val>10) return false;
	switch(val%10){
		case 1:
			if(x==o_x){
				var count = 0;
				if(y>o_y) j=1;
				else j=-1;
				for(var i=o_y+j;i!=y;i+=j)
					if(maps[id][i][x]>0) count++;
				if(count==1&&maps[id][y][x]!=0){
					if(val>10&&maps[id][y][x]<10) ans=true;
					else if(val<10&&maps[id][y][x]>10) ans=true;
				}
				else if(count==0&&maps[id][y][x]==0) ans=true;
			}
			else if(y==o_y){
				var count = 0;
				if(x>o_x) j=1;
				else j=-1;
				for(var i=o_x+j;i!=x;i+=j)
					if(maps[id][y][i]>0) count++;
				if(count==1&&maps[id][y][x]!=0){
					if(val>10&&maps[id][y][x]<10) ans=true;
					else if(val<10&&maps[id][y][x]>10) ans=true;
				}
				else if(count==0&&maps[id][y][x]==0) ans=true;
			}
			break;
		case 2:
			if(x==o_x){
				var count = 0;
				if(y>o_y) j=1;
				else j=-1;
				for(var i=o_y+j;i!=y;i+=j)
					if(maps[id][i][x]>0) count++;
				if(count==0) ans=true;
			}
			else if(y==o_y){
				var count = 0;
				if(x>o_x) j=1;
				else j=-1;
				for(var i=o_x+j;i!=x;i+=j)
					if(maps[id][y][i]>0) count++;
				if(count==0) ans=true;
			}
			break;
		case 3:
			var j=x-o_x,i=y-o_y;
			if(i<0) i=-i;
			if(j<0) j=-j;
			if(i==2&&j==1&&maps[id][(y+o_y)/2][o_x]==0) ans=true;
			else if(i==1&&j==2&&maps[id][o_y][(x+o_x)/2]==0) ans=true;
			break;
		case 4:
			var j=x-o_x,i=y-o_y;
			if(i<0) i=-i;
			if(j<0) j=-j;
			if(val>10&&y>4){
				if(i==2&&j==2&&maps[id][(y+o_y)/2][(x+o_x)/2]==0) ans=true;
			}
			else if(val<10&&y<5){
				if(i==2&&j==2&&maps[id][(y+o_y)/2][(x+o_x)/2]==0) ans=true;
			}
			break;
		case 5:
			if(val>10&&x>2&&x<6&&y>6&&y<10&&Math.abs(y-o_y)==1&&Math.abs(x-o_x)==1) ans=true;
			else if(x>2&&x<6&&y>-1&&y<3&&Math.abs(y-o_y)==1&&Math.abs(x-o_x)==1) ans=true;
			break;
		case 6:
			var i = Math.abs(y-o_y),j=Math.abs(x-o_x);
			if(val>10&&x>2&&x<6&&y>6&&y<10){
				if(i==1&&j==0) ans=true;
				else if(j==1&&i==0) ans=true;
			}
			else if(x>2&&x<6&&y>-1&&y<3){
				if(i==1&&j==0) ans=true;
				else if(j==1&&i==0) ans=true;
			}
			break;
		case 7:
			var i = Math.abs(y-o_y),j=Math.abs(x-o_x);
			if(val>10&&y<=o_y){
				if(o_y<5&&(i+j)==1) ans=true;
				else if(i==1&&j==0) ans=true;
			}
			else if(val<10&&y>=o_y){
				if(o_y>4&&(i+j)==1) ans=true;
				else if(i==1&&j==0) ans=true;
			}
			break;
		
	}
	return ans;
}


function king_to_king(id){
	var count=0,red=find_val(id,16),black=find_val(id,6);
	//console.log(red,black);
	if(red[1]==black[1]){
		for(var i=black[0]+1;i<red[0];i++)
			if(maps[id][i][red[1]]>0) count++;
	}
	return (red[1]==black[1])&&count==0;
}

function check_cap(id){
	var red=find_val(id,16),black=find_val(id,6);
	for(var i=0;i<10;i++)
		for(var j=0;j<9;j++){
			if(red!=false&&(red[0]!=i||red[1]!=j)&&(maps[id][i][j]>0&&maps[id][i][j]<10)&&
				legal_move(id,maps[id][i][j],red[1],red[0],j,i)) return true;
			if(black!=false&&(black[0]!=i||black[1]!=j)&&(maps[id][i][j]>10)&&
				legal_move(id,maps[id][i][j],black[1],black[0],j,i)) return true;
		}
}

io.on('connection', function(socket){
	var room = -1;
	socket.on('find',function(data){
		room = room_id;
		socket.join(room_id);
		io.to(room).emit('find',1);
		if(wait){
			room_id++;
			maps[room] = init_map();
			io.to(room).emit('start',maps[room]);
		}
		wait = 1-wait ;
	});
	
	socket.on('moving',function(data){
		console.log(data.val,data.x,data.y,data.o_x,data.o_y);
		if(legal_move(room,data.val,data.x,data.y,data.o_x,data.o_y)){
			io.to(room).emit('turn',1);
			maps[room][data.y][data.x]=data.val;
			
			maps[room][data.o_y][data.o_x]=0;
			io.to(room).emit('map',maps[room]);
			io.to(room).emit('sign',[data.y,data.x]);
			io.to(room).emit('cap',check_cap(room));
			if(find_val(room,6)==false)	io.to(room).emit('over','red');
			else if(find_val(room,16)==false)	io.to(room).emit('over','black');
			else if(king_to_king(room)){
				if(data.val>10) io.to(room).emit('over','black');
				else io.to(room).emit('over','red');
			}
			
			
			
		}
		io.to(room).emit('map',maps[room]);
	});
	
	socket.on('leave',function(data){
		socket.leave(room);
		room=-1;
	});
	socket.on('disconnect',function(){
		if(room!=-1){
			socket.leave(room);
			io.to(room).emit('leave',1);
		}
	});
});

//port
http.listen(process.env.PORT || 3000, function(){
	console.log('listening on *:3000');
});