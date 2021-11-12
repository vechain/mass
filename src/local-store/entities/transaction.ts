import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm'
import { fixedBytes } from '../../explorer-db/transformers'
import { PendingTransaction } from '../../thor'

@Entity()
export class Transaction {
    @PrimaryColumn({ type: 'blob', length: 32, transformer: fixedBytes(32, 'tx.txID') })
    public txID!: string

    @Column('simple-json')
    public body!: Omit<PendingTransaction, 'meta'>

    @Column({ type: 'varchar', nullable: true })
    public state!: string

    @CreateDateColumn()
    public createdAt!: Date;
}
