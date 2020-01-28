import { Component, OnInit, ViewChild, AfterContentInit } from '@angular/core';
import { MatTabChangeEvent, MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component';
import { Browser } from '@syncfusion/ej2-base';
import { chartDataValue } from './financial-data';
import {
  ILoadedEventArgs, ChartTheme,
  ChartComponent, IAxisLabelRenderEventArgs
} from '@syncfusion/ej2-angular-charts';
import { ApiService } from 'src/app/services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';



@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css'],

})

export class IndexComponent implements OnInit, AfterContentInit {

  crypto = 'BTC';
  currency = 'Euro';
  loginDialogRef: MatDialogRef<LoginComponent>;
  registerDialogRef: MatDialogRef<RegisterComponent>;
  dialogConfig = new MatDialogConfig();
  referal: any;

  @ViewChild('chartcontainer')
  public chart: ChartComponent;
  public data1: object[] = chartDataValue;

  // Initializing Primary X Axis
  public primaryXAxis: object = {
    valueType: 'DateTime',
    crosshairTooltip: { enable: true },
    majorGridLines: { width: 0 }
  };
  // Initializing Primary Y Axis
  public primaryYAxis: object = {
    title: 'Price',
    labelFormat: 'n0',
    lineStyle: { width: 0 },
    rangePadding: 'None',
    majorTickLines: { width: 0 }
  };

  public tooltip: object = {
    enable: true,
    shared: true
  };
  public marker: object = {
    visible: false
  };
  public crosshair: object = {
    enable: true,
    lineType: 'Vertical', line: {
      width: 0,
    }
  };
  public legendSettings: object = {
    visible: false
  };

  // custom code end
  public chartArea: object = {
    border: {
      width: 0
    }
  };
  public width: string = Browser.isDevice ? '100%' : '80%';

  public axisLabelRender(args: IAxisLabelRenderEventArgs): void {
    if (args.axis.title === 'Price') {
      args.text = '$' + args.text;
    }
  }
  // custom code start
  public load(args: ILoadedEventArgs): void {
    let selectedTheme: string = location.hash.split('/')[1];
    selectedTheme = selectedTheme ? selectedTheme : 'Material';
    args.chart.theme = (selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)).replace(/-dark/i, 'Dark') as ChartTheme;
  }

  constructor(
    private dialog: MatDialog,
    private apiService: ApiService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private translate: TranslateService
  ) {
    translate.setDefaultLang('en');
    }

  ngOnInit() {
    if (this.apiService.isLoggedIn) {
      this.router.navigate(['dashboard']);
    }
  }

  ngAfterContentInit() {
  }

  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    // console.log(tabChangeEvent);
    // console.log(tabChangeEvent.index);
  }
}
