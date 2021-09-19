import React, {useEffect, useReducer, useRef} from "react";

const BRICKS = [      // 0 = nic/EMPTY , cislo = index barvy z COLORS. x a y rozmer pole kazde brick musi byt stejny
  [ [1,1], [1,1] ],
  [ [2,2,0], [0,2,2], [0,0,0] ],
  [ [0,3,3], [3,3,0], [0,0,0] ],
  [ [0,4,0], [4,4,4], [0,0,0] ],
  [ [0,5,0], [0,5,0], [5,5,0] ],
  [ [0,6,0,0], [0,6,0,0], [0,6,0,0], [0,6,0,0] ]
]
const GAME_STATUS = {
  Running:          "RUNING",
  GameOver:         "GAMEOVER"
}
const ACTION = {
  Restart:          "RESTART",
  Move:             "MOVE",     // pohyb doleva/doprava
  TimeTick:         "TIMETICK"  // pad kosticky z aktualni pozice az dolu
}
const COLOR =       ["#eee","blue", "red", "green", "yellow", "magenta","orange", "violet", "grey"]
const SPEED =       300 // [ms]
const EMPTY =       0
const SIZE = {
  Width:            10,
  Height:           20
}
const CONTROL = { 
  Left:             37, 
  Right:            39, 
  Rotate:           38
}
function getInitialState() {
  return {
    status:           GAME_STATUS.Running,
    position: {
      x:              Math.floor( SIZE.Width / 2 )-1,
      y:              0
    },
    brick:            BRICKS[ Math.floor(Math.random() * BRICKS.length) ],
    board:            [...Array(SIZE.Height)].map(x=>Array(SIZE.Width).fill(EMPTY))    
  }
}

function checkCollision(board, brick, position) {
  for( let y=0; y<brick.length; y++ )
    for (let x=0; x<brick[y].length; x++ )
      // kolize vyhodnocuju POUZE v pripade, ze jsem na kousku brick. tj. nevyhodnucuju "vzduch" okolo
      if ((brick[y][x] !== 0) && ( 
          // 1. neprekroceni vodorovneho rozsahu (x)
          ( (x + position.x) < 0 || (x + position.x) >= SIZE.Width ) 
          // 2. neprekroceni spodni hrany (y)
          || ( (y + position.y) >= SIZE.Height ) 
          // 3. naraz do jiz polozenych kosticek - kontrola obsahu plochy ZA AKTUALNIM tetrominem. pokud uz tam neco je, pak nastala kolize
          || ( (board[y + position.y][x + position.x]) !== 0 ) 
        )) return true
}

function rotateBrick(matrix) { 
  let rotated = matrix[0].map((val, index) => matrix.map(row => row[index]).reverse())
  return rotated
}

function gameReducer(state, action) {
  switch (action.type) {
    case ACTION.Restart:
      return { ...getInitialState() }
    case ACTION.Move:
      switch (action.keyCode) {
        case CONTROL.Left: 
          if (!checkCollision(state.board, state.brick, {x: state.position.x-1, y: state.position.y} )) 
            return {...state, position: {x: state.position.x-1, y: state.position.y} }
          break  
        case CONTROL.Right: 
          if (!checkCollision(state.board, state.brick, {x: state.position.x+1, y: state.position.y} )) 
            return {...state, position: {x: state.position.x+1, y: state.position.y} }
          break
        case CONTROL.Rotate: 
          if (!checkCollision(state.board, rotateBrick(state.brick), state.position )) 
            return {...state, brick: rotateBrick(state.brick) }
          break
        default:
      }
      break
    case ACTION.TimeTick: 
      // overim, jestli nasledna pozice neni v kolizi s jiz polozenymi kostickami
      let newY = state.position.y + 1
      if (checkCollision( state.board, state.brick, {x: state.position.x, y: newY} ) ) {
        // 0. kontrola konce hry - pokud je kolize na vychozi pozici bricku. neresim krajni pripad, kdy novy brick narazi do svisle hranice
        if (state.position.y === 0)
          return { ...state, status: GAME_STATUS.GameOver }
        // 1. brick presunout do boardu
        let newBoard = [...state.board]
        for( let y=0; y<state.brick.length; y++) 
          for (let x=0; x<state.brick[y].length; x++) 
            if (state.brick[y][x] !== 0) 
              newBoard[y + state.position.y][x + state.position.x] = state.brick[y][x]
        // 2. vymazat plne radky
        let rowsToDelete = []
        for( let y=0; y<SIZE.Height; y++)         
          if (!newBoard[y].includes(EMPTY)) 
            rowsToDelete.push(y)   // najit komplet obsazene radky a pridam je do seznamu radek ke smazani          
        rowsToDelete.sort().reverse().forEach(rowToDelete => { newBoard.splice(rowToDelete,1) }); // mazu od konce, at se nepomichaji indexy radku
        for (let i=0; i<rowsToDelete.length; i++) 
          newBoard.unshift(Array(SIZE.Width).fill(0))
        // 3. vyrobit novy block
        return { ... getInitialState(), board: newBoard}
      } else return {...state, position: {x: state.position.x, y: newY} }
    default:
  }
  return {...state}
}

function useInterval(callback, delay) {
  const savedCallback = useRef(callback)
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

function Box({color}) {
  return (<div style={{ width:20, height:20, display: 'inline-block', backgroundColor: color, border: '1px solid #ccc'}} />)
}

export default function Tetris() {
  let [state, dispatch] = useReducer(gameReducer, getInitialState() )
  useInterval(() => { dispatch({type: ACTION.TimeTick}) }, state.status===GAME_STATUS.Running ? SPEED : 0)  
  useEffect(() => { document.addEventListener('keydown', handleGameAction); return () => { document.removeEventListener('keydown', handleGameAction) } });  
  console.log(state)

  function handleGameAction(e) {
    if ( [CONTROL.Left, CONTROL.Right, CONTROL.Rotate, CONTROL.Fall].includes(e.keyCode) ) {
      e.preventDefault(); 
      dispatch({type: ACTION.Move, keyCode: e.keyCode}) }
  }

  let out = [], draw = []
  for (let y=0; y<SIZE.Height;y++) {
    draw[y] = []
    for (let x=0;x<SIZE.Width;x++) {
      // implicitne vezmu varvu z brick jiz zafixovanych na desce
      draw[y][x] = <Box color={COLOR[state.board[y][x]]} key={`${y}-${x}`}/>
      // vykresleni aktualne padajici kosticky
      for( let yTetro=0; yTetro<state.brick.length; yTetro++) 
        for (let xTetro=0; xTetro<state.brick[yTetro].length; xTetro++)
          // vyhodnocuju jen jedinou kosticku z prochazeneho brick - ta ktera je na pozici Y,X
          if ( x === xTetro+state.position.x && y === yTetro+state.position.y && state.brick[yTetro][xTetro] !== 0) 
            draw[y][x] = <Box color={COLOR[state.brick[yTetro][xTetro]]} key={`${y}-${x}`} />
    }
    out.push(<div style={{display: 'block', lineHeight: 0}} key={y}>{[...draw[y]]}</div>)
  }
  return (
  <React.Fragment>
    React Tetris - controls: LEFT, RIGHT, UP=Rotate
    { state.status === GAME_STATUS.GameOver && <div><button onClick={()=>dispatch({type: ACTION.Restart})}>Game Over! Play again</button></div>}
    <div className="Game">{out}</div>
  </React.Fragment>); 
}