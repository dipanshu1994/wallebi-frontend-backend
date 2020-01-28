import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageCryptoComponent } from './manage-crypto.component';

describe('ManageCryptoComponent', () => {
  let component: ManageCryptoComponent;
  let fixture: ComponentFixture<ManageCryptoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageCryptoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageCryptoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
