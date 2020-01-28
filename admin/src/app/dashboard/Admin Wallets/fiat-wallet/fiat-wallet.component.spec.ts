import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FiatWalletComponent } from './fiat-wallet.component';

describe('FiatWalletComponent', () => {
  let component: FiatWalletComponent;
  let fixture: ComponentFixture<FiatWalletComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FiatWalletComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FiatWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
