import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitarReservaComponent } from './solicitar-reserva.component';

describe('SolicitarReservaComponent', () => {
  let component: SolicitarReservaComponent;
  let fixture: ComponentFixture<SolicitarReservaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitarReservaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitarReservaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
