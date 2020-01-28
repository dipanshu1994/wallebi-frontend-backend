import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiverCryptoComponent } from './receiver-crypto.component';

describe('ReceiverCryptoComponent', () => {
  let component: ReceiverCryptoComponent;
  let fixture: ComponentFixture<ReceiverCryptoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReceiverCryptoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiverCryptoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
