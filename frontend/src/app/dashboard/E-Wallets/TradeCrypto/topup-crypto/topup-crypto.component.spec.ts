import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopupCryptoComponent } from './topup-crypto.component';

describe('TradeCryptoComponent', () => {
  let component: TopupCryptoComponent;
  let fixture: ComponentFixture<TopupCryptoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TopupCryptoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopupCryptoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
