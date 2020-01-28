import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'expoToNumber'
})
export class ExpoToNumberPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (value !== undefined) {
      if (Math.abs(value) < 1.0) {
        const e = parseInt(value.toString().split('e-')[1], 10);
        if (e) {
          value *= Math.pow(10, e - 1);
          value = '0.' + (new Array(e)).join('0') + value.toString().substring(2);
        }
      } else {
        let e = parseInt(value.toString().split('+')[1], 10);
        if (e > 20) {
          e -= 20;
          value /= Math.pow(10, e);
          value += (new Array(e + 1)).join('0');
        }
      }
      return value;
    }
  }
}
