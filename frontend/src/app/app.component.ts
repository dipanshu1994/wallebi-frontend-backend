import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'MATD';
  color = '#2196F3';

  constructor() {
    localStorage.setItem('lang', 'en');
  }
}
