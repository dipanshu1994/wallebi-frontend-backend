import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRefferalComponent } from './user-refferal.component';

describe('UserRefferalComponent', () => {
  let component: UserRefferalComponent;
  let fixture: ComponentFixture<UserRefferalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserRefferalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserRefferalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
