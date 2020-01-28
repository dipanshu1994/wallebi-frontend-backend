import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EWalletCryptoComponent } from './e-wallet-crypto.component';

describe('EWalletCryptoComponent', () => {
  let component: EWalletCryptoComponent;
  let fixture: ComponentFixture<EWalletCryptoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EWalletCryptoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EWalletCryptoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
