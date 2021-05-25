import React from 'react'
import './Key.css'

export const Key = ({ icon }) => {

    return (
        <div className="keyboard__container">
            <div className="key--fn">
                <span>{ icon }</span>
            </div>
        </div>
    )
}