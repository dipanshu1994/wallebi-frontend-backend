import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LiquidityProviderComponent } from './liquidity-provider.component';

describe('LiquidityProviderComponent', () => {
  let component: LiquidityProviderComponent;
  let fixture: ComponentFixture<LiquidityProviderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LiquidityProviderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LiquidityProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
