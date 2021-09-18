import React, {useEffect, useReducer} from "react";
import { TETROMINOS, rotate } from "./Tetrominos";
import useInterval from "./useInterval"

const SPEED =       1000 // [ms]
const EMPTY =       0
const GAME_SIZE = {
  Width:            10,
  Height:           20
}
const CONTROL = { 
  Left:             37, 
  Right:            39, 
  Rotate:           38, 
  Fall:             40 
}
const ACTION = {
  Move:             "MOVE",     // pohyb doleva/doprava
  StepFall:         "STEPFALL"  // pad kosticky z aktualni pozice az dolu
}
const COLOR = ["#eee","blue", "red", "green", "yellow", "magenta","orange", "violet", "grey"]

let initialBoard = []
for (let y=0; y<GAME_SIZE.Height; y++) {
  initialBoard[y] = []
  for (let x=0; x<GAME_SIZE.Width; x++) {
    initialBoard[y][x] = EMPTY
  }
}
const initialState = {
  player: {
    x: Math.floor( GAME_SIZE.Width / 2 ),
    y: 0
  },
  tetromino:  TETROMINOS[1], // TETROMINOS[ Math.floor(Math.random() * TETROMINOS.length) ] ,
  board: initialBoard
}

function checkCollision(board, tetromino, player) {
  // projdu kazdy jednotlivy bod prave hraneho tetromina
  for( let y=0; y<tetromino.length; y++) {
    for (let x=0; x<tetromino[y].length; x++) {
      // kolize vyhodnocuju POUZE v pripade, ze jsem na kousku teromina. tj. nevyhodnucuju "vzduch" okolo
      if (tetromino[y][x] !== 0) {
        // 1. neprekroceni vodorovneho rozsahu (x)
        if ( (x + player.x) < 0 || (x + player.x)>=GAME_SIZE.Width ) {
          console.log("Kolize se svislym okrajem")
          return true
        }
        // 2. neprekroceni spodni hrany
        if ( (y + player.y)>=GAME_SIZE.Height ) {
          console.log("Kolize se spodnim okrajem")
          return true
        }
        // 3. naraz do jiz polozenych kosticek - kontrola obsahu plochy ZA AKTUALNIM tetrominem. pokud uz tam neco je, pak nastala kolize
        if ( (board[y + player.y][x + player.x]) !== 0 ) {
          console.log("kolize s jiz polozenou kostickou")
          return true
        }
      }
    }
  }
}

function gameReducer(state, action) {
  switch (action.type) {
    // ovladani kosticky je mozne i mimo casovy interval posunu. lze lze vykonat vicero akci pri jednom pohybu kosticky dolu
    case ACTION.Move:
      switch (action.keyCode) {
        case CONTROL.Left: 
          if (!checkCollision(state.board, state.tetromino, {x: state.player.x-1, y: state.player.y} )) 
            return {...state, player: {x: state.player.x-1, y: state.player.y} }
          break
        case CONTROL.Right: 
          if (!checkCollision(state.board, state.tetromino, {x: state.player.x+1, y: state.player.y} )) 
            return {...state, player: {x: state.player.x+1, y: state.player.y} }
          break
        case CONTROL.Rotate: 
          if (!checkCollision(state.board, rotate(state.tetromino), state.player )) 
            return {...state, tetromino: rotate(state.tetromino) }
          break
        case CONTROL.Fall: 
          break
      }
      break
    case ACTION.StepFall: 
      let newY = state.player.y + 1
      // overim, jestli nasledna pozice neni v kolizi s jiz polozenymi kostickami
      if (checkCollision( state.board, state.tetromino, {x: state.player.x, y: newY} ) ) {
        // 1. tetromino presunout do boardu
        let newBoard = [...state.board]
        for( let y=0; y<state.tetromino.length; y++) {
          for (let x=0; x<state.tetromino[y].length; x++) {
            if (state.tetromino[y][x] !== 0) 
              newBoard[y + state.player.y][x + state.player.x] = state.tetromino[y][x]
          }
        }
        // 2. vymazat plne radky
        // 3. vyrobit nove teromino
        return {
          player: {
            x: Math.floor( GAME_SIZE.Width / 2 ),
            y: 0
          },
          tetromino:  TETROMINOS[ Math.floor(Math.random() * TETROMINOS.length) ] ,
          board: newBoard
        }


      } else {        
        // nic nebrani v posunu na naslednou pozici
        return {...state, player: {x: state.player.x, y: newY} }
      }
      break
  }
  return {...state}
}

function Tetris() {
  let [state, dispatch] = useReducer(gameReducer, initialState)
  
  useInterval( () => { dispatch({type: ACTION.StepFall}) }, SPEED)  

  console.log(state)

  function handleGameAction(e) {
    // pouze kdyz je zmacnuta sipka... a pocita se pouze 1.stisk sipky!
    if ( [CONTROL.Left, CONTROL.Right, CONTROL.Rotate, CONTROL.Fall].includes(e.keyCode) ) {
      console.log("klik")
      // potlaci default akci prohlizece 
      e.preventDefault(); 
      // nastavi novy smer pohybu
      dispatch({type: ACTION.Move, keyCode: e.keyCode}) }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleGameAction)
    return () => { document.removeEventListener('keydown', handleGameAction) }
  });  

  return (<div className="Game">
          {
            // radky hraci plochy
            [...Array(GAME_SIZE.Height).keys()].map( y => {
              // vnejsi obal radku
              return <div style={{display: 'block', lineHeight: 0}} key={y}>{ 
                // sloupecek v kazdem z radku
                [...Array(GAME_SIZE.Width).keys()].map( x => {
                  // POKUD se na vykreslovane pozici nachazi jidlo...
                    return <div  key={`${x}-${y}`} style={{ width:10, height:10, display: 'inline-block', backgroundColor: COLOR[state.board[y][x]],  border: '1px solid #ccc'}}/>})
              }</div>})} 
          </div>); 
}

export default Tetris;
