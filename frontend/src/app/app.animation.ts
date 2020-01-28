import { animate, state, style, transition, trigger, query, stagger, group, keyframes, useAnimation } from '@angular/animations';
import { bounce, rollIn, zoomInDown, rubberBand, rotateOutUpRight, rotateInUpRight, flip, flash, shake, zoomIn } from 'ng-animate';

export let routerTransitionRight = trigger('routerTransitionRight', [
    state('void', style({})),
    state('*', style({})),
    transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('0.5s ease-in-out', style({ transform: 'translateX(0%)' }))
    ]),
    transition(':leave', [
        style({ transform: 'translateX(0%)' }),
        animate('0.5s ease-in-out', style({ transform: 'translateX(100%)' }))
    ])
]);

export let slideToLeft = trigger('slideToLeft', [
    state('void', style({})),
    state('*', style({})),
    transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('0.5s ease-in-out', style({ transform: 'translateX(0%)' }))
    ]),
    transition(':leave', [
        style({ transform: 'translateX(0%)' }),
        animate('0.5s ease-in-out', style({ transform: 'translateX(-100%)' }))
    ])
]);

export let slideToBottom = trigger('slideToBottom', [
    state('void', style({})),
    state('*', style({})),
    transition(':enter', [
        style({ transform: 'translateY(-100%)' }),
        animate('0.5s ease-in-out', style({ transform: 'translateY(0%)' }))
    ]),
    transition(':leave', [
        style({ transform: 'translateY(0%)' }),
        animate('0.5s ease-in-out', style({ transform: 'translateY(100%)' }))
    ])
]);

export let slideToTop = trigger('slideToTop', [
    state('void', style({})),
    state('*', style({})),
    transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('0.5s ease-in-out', style({ transform: 'translateY(0%)' }))
    ]),
    transition(':leave', [
        style({ transform: 'translateY(0%)' }),
        animate('0.5s ease-in-out', style({ transform: 'translateY(-100%)' }))
    ])
]);

export let photosAnimation = trigger('photosAnimation', [
    transition('* <=> *', [
        query('img', style({ transform: 'translateY(100%)' })),
        query('img',
            stagger('2000ms', [
                animate('2000ms', style({ transform: 'translateY(0)' }))
            ]))
    ])
]);


export let fadeAnimation = trigger('fadeAnimation', [transition('* <=> *', [
    query(
        ':enter',
        [style({ opacity: 0 })],
        { optional: true }
    ),
    query(
        ':leave',
        [style({ opacity: 1 }), animate('0.3s', style({ opacity: 0 }))],
        { optional: true }
    ),
    query(
        ':enter',
        [style({ opacity: 0 }), animate('0.3s', style({ opacity: 1 }))],
        { optional: true }
    )
])
]);

export let fade = trigger('fade', [
    state('void', style({ opacity: 0 })),
    transition('void <=> *', [
        animate(1000)
    ])
]);

export let bounceAnimate = trigger('bounceAnimate', [transition('* => *', useAnimation(flip, {
    params: {
        timing: 1,
        a: '-3000px',
        b: '25px',
        c: '-10px',
        d: '5px',
    }
}))]);

export let zoomInDownAnimate = trigger('zoomInDownAnimate', [transition('* => *', useAnimation(zoomInDown))]);

export let rubberBandAnimate = trigger('rubberBandAnimate', [transition('* => *', useAnimation(rubberBand))]);

export let rotateInUpRightAnimate = trigger('rotateInUpRightAnimate', [transition('* => *', useAnimation(rotateInUpRight))]);

export let flashAnimate = trigger('flashAnimate', [transition('* => *', useAnimation(flash))]);

export let shakeAnimate = trigger('shakeAnimate', [transition('* => *', useAnimation(shake))]);
