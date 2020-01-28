import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCryptoComponent } from './add-crypto.component';

describe('AddCryptoComponent', () => {
  let component: AddCryptoComponent;
  let fixture: ComponentFixture<AddCryptoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddCryptoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCryptoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
