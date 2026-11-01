export const SHAPES=[
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  [[1,0,0],[1,1,1],[0,0,0]],[[0,0,1],[1,1,1],[0,0,0]],
  [[1,1],[1,1]],[[0,1,1],[1,1,0],[0,0,0]],
  [[0,1,0],[1,1,1],[0,0,0]],[[1,1,0],[0,1,1],[0,0,0]]
];
export const BLOCK_COLORS=['#45cce7','#578ce9','#f9ad4d','#f4d550','#77cc7d','#b58bea','#f17d94'];
export class TetrisEngine {
  constructor(random=Math.random){this.random=random;this.board=Array.from({length:20},()=>Array(10).fill(0));this.bag=[];this.score=0;this.lines=0;this.state='playing';this.next=this.take();this.spawn()}
  take(){if(!this.bag.length){this.bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]]}}return this.bag.pop()}
  get completed(){return Math.min(10,Math.floor(this.lines/5))}
  get level(){return Math.min(10,this.completed+1)}
  get interval(){return [1000,900,800,710,630,560,500,440,380,330][this.level-1]}
  spawn(){const kind=this.next;this.next=this.take();this.piece={kind,matrix:SHAPES[kind].map(r=>[...r]),x:Math.floor((10-SHAPES[kind].length)/2),y:0};if(this.collides())this.state='over'}
  collides(matrix=this.piece.matrix,x=this.piece.x,y=this.piece.y){return matrix.some((row,dy)=>row.some((v,dx)=>v&&(x+dx<0||x+dx>=10||y+dy>=20||y+dy>=0&&this.board[y+dy][x+dx])))}
  move(dx){if(this.state!=='playing'||this.collides(this.piece.matrix,this.piece.x+dx,this.piece.y))return false;this.piece.x+=dx;return true}
  rotate(){
    if(this.state!=='playing')return false;
    const m=this.piece.matrix,n=m.length,rotated=Array.from({length:n},(_,y)=>Array.from({length:n},(_,x)=>m[n-1-x][y]));
    for(const dx of [0,-1,1,-2,2])if(!this.collides(rotated,this.piece.x+dx,this.piece.y)){this.piece.matrix=rotated;this.piece.x+=dx;return true}return false;
  }
  down(soft=false){if(this.state!=='playing')return false;if(!this.collides(this.piece.matrix,this.piece.x,this.piece.y+1)){this.piece.y++;if(soft)this.score++;return true}this.lock();return false}
  hardDrop(){if(this.state!=='playing')return;while(!this.collides(this.piece.matrix,this.piece.x,this.piece.y+1)){this.piece.y++;this.score+=2}this.lock()}
  lock(){
    this.piece.matrix.forEach((r,dy)=>r.forEach((v,dx)=>{if(v&&this.piece.y+dy>=0)this.board[this.piece.y+dy][this.piece.x+dx]=this.piece.kind+1}));
    const before=this.board.length;this.board=this.board.filter(row=>row.some(v=>!v));const cleared=before-this.board.length;
    while(this.board.length<20)this.board.unshift(Array(10).fill(0));
    this.score+=[0,100,300,500,800][cleared]*this.level;
    const previous=this.completed;this.lines+=cleared;this.spawn();
    if(previous<10&&this.completed===10&&this.state!=='over')this.state='won';
  }
}
