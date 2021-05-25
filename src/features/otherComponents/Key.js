import React from 'react'
import './Key.css'

export const Key = ({ icon }) => {

    return (
        <div class="keyboard__container">
            <div class="key--fn">
                <span>{ icon }</span>
            </div>
        </div>
    )
}