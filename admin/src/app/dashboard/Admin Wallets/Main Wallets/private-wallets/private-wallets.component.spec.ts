import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateWalletsComponent } from './private-wallets.component';

describe('PrivateWalletsComponent', () => {
  let component: PrivateWalletsComponent;
  let fixture: ComponentFixture<PrivateWalletsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrivateWalletsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivateWalletsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
