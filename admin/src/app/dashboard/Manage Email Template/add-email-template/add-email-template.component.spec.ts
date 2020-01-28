import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEmailTemplateComponent } from './add-email-template.component';

describe('AddEmailTemplateComponent', () => {
  let component: AddEmailTemplateComponent;
  let fixture: ComponentFixture<AddEmailTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddEmailTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
