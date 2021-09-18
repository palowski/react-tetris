const TETROMINO_0 = [
    [1,1],
    [1,1]
  ]
  const TETROMINO_1 = [
    [2,2,0],
    [0,2,2],
    [0,0,0]
  ]
  const TETROMINO_2 = [
    [0,3,3],
    [3,3,0],
    [0,0,0]
  ]
  const TETROMINO_3 = [
    [0,4,0],
    [4,4,4],
    [0,0,0]
  ]
  const TETROMINO_4 = [
    [0,5,0],
    [0,5,0],
    [5,5,0]
  ]
  const TETROMINO_5 = [
    [0,6,0,0],
    [0,6,0,0],
    [0,6,0,0],
    [0,6,0,0]
  ]
  
  export const TETROMINOS = [
    TETROMINO_0, TETROMINO_1, TETROMINO_2, TETROMINO_3, TETROMINO_4, TETROMINO_5
  ]

  export function rotate(matrix) {
    let rotated = matrix[0].map((val, index) => matrix.map(row => row[index]).reverse())
    console.log("rotated matrix")
    console.log(rotated)
    return rotated
  }
    