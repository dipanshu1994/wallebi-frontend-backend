import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProvidersPairFeeComponent } from './providers-pair-fee.component';

describe('ProvidersPairFeeComponent', () => {
  let component: ProvidersPairFeeComponent;
  let fixture: ComponentFixture<ProvidersPairFeeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProvidersPairFeeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProvidersPairFeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
