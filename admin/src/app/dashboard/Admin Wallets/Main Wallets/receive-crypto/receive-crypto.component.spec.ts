import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiveCryptoComponent } from './receive-crypto.component';

describe('ReceiveCryptoComponent', () => {
  let component: ReceiveCryptoComponent;
  let fixture: ComponentFixture<ReceiveCryptoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReceiveCryptoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiveCryptoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
