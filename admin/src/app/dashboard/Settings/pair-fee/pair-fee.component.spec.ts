import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PairFeeComponent } from './pair-fee.component';

describe('PairFeeComponent', () => {
  let component: PairFeeComponent;
  let fixture: ComponentFixture<PairFeeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PairFeeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PairFeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
