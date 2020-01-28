import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeCurrenciesComponent } from './trade-currencies.component';

describe('TradeCurrenciesComponent', () => {
  let component: TradeCurrenciesComponent;
  let fixture: ComponentFixture<TradeCurrenciesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TradeCurrenciesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeCurrenciesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
