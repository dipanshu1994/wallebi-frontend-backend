import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserKycVerificationComponent } from './user-kyc-verification.component';

describe('UserKycVerificationComponent', () => {
  let component: UserKycVerificationComponent;
  let fixture: ComponentFixture<UserKycVerificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserKycVerificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserKycVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
