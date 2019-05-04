export class MatrixTransformer {
  public matrix: number[] = [1, 0, 0, 1, 0, 0];      // normal matrix
  public invMatrix: number[] = [1, 0, 0, 1];   // inverse matrix


  constructor(x: number, y: number , scale: number , rotate: number) {
    this.createMatrix(x, y, scale, rotate);
  }
  private  createMatrix(x, y, scale, rotate) {

    // create the scale and rotation part of the matrix
    this.matrix[3] =   this.matrix[0] = Math.cos(rotate) * scale;
    this.matrix[2] = -(this.matrix[1] = Math.sin(rotate) * scale);
    // translation
    this.matrix[4] = x;
    this.matrix[5] = y;

    // calculate the inverse transformation
    // first get the cross product of x axis and y axis
    const cross = this.matrix[0] * this.matrix[3] - this.matrix[1] * this.matrix[2];
    // now get the inverted axies
    this.invMatrix[0] =  this.matrix[3] / cross;
    this.invMatrix[1] = -this.matrix[1] / cross;
    this.invMatrix[2] = -this.matrix[2] / cross;
    this.invMatrix[3] =  this.matrix[0] / cross;
  }

  // function to transform to world space
  public  toWorld(pos: { x: number, y: number }) {
    let xx, yy, m;
    m = this.invMatrix;
    xx = pos.x - this.matrix[4];
    yy = pos.y - this.matrix[5];
    return {
        x:   xx * m[0] + yy * m[2] ,
        y:   xx * m[1] + yy * m[3]
    };
   }
}

