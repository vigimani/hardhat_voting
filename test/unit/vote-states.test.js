const { assert, expect, expectRevert, withNamedArgs } = require("chai")
const { network, deployments, ethers } = require("hardhat");
const { BN } = require('@openzeppelin/test-helpers');
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Units tests on Workflows status", function () {
        let accounts;
        let vote;

        before(async() => {
            accounts = await ethers.getSigners()
            deployer = accounts[0]
        })
        
        //Test if STATES
        describe("Only Owner can change state", function() {  
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
            it('should NOT start Proposal registering if NOT the owner', async function () {
                await expect(vote.connect(accounts[1]).startProposalsRegistering()).to.be.revertedWith("Ownable: caller is not the owner")
            });
            it('should NOT end Proposal registering if NOT the owner', async function () {
                await vote.startProposalsRegistering()
                await expect(vote.connect(accounts[1]).endProposalsRegistering()).to.be.revertedWith("Ownable: caller is not the owner")
            });
            it('should NOT start voting session if NOT the owner', async function () {
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await expect(vote.connect(accounts[1]).startVotingSession()).to.be.revertedWith("Ownable: caller is not the owner")
            });
            it('should NOT end voting session if NOT the owner', async function () {
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await expect(vote.connect(accounts[1]).endVotingSession()).to.be.revertedWith("Ownable: caller is not the owner")
            });
            it('should NOT launch tallyVotes if NOT the owner', async function () {
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await vote.endVotingSession()
                await expect(vote.connect(accounts[1]).tallyVotes()).to.be.revertedWith("Ownable: caller is not the owner")
            });
        })
        describe("Check each steap of Workflows", function() {  
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
            it('should start Proposal registering if the owner', async function () {
                await expect(vote.startProposalsRegistering()).to.emit(vote,"WorkflowStatusChange").withArgs(BN(0), BN(1))
            });
            it('should end Proposal registering if the owner', async function () {
                await vote.startProposalsRegistering()
                await expect(vote.endProposalsRegistering()).to.emit(vote,"WorkflowStatusChange").withArgs(BN(1),BN(2))
            });
            it('should start voting session if the owner', async function () {
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await expect(vote.startVotingSession()).to.emit(vote,"WorkflowStatusChange").withArgs(BN(2),BN(3))
            });
            it('should end voting session if the owner', async function () {
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await expect(vote.endVotingSession()).to.emit(vote,"WorkflowStatusChange").withArgs(BN(3),BN(4))
            });
            it('should launch tallyVotes if the owner', async function () {
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await vote.endVotingSession()
                await expect(vote.tallyVotes()).to.emit(vote,"WorkflowStatusChange").withArgs(BN(4),BN(5))
            });
        })    
        //A FINIR
        describe("check change Workflows if wrong previous status", function() {  
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
            it('should NOT start Proposal registering if incorrect WF', async function () {
                await vote.startProposalsRegistering()
                await expect(vote.startProposalsRegistering()).to.be.revertedWith('Registering proposals cant be started now')
                await vote.endProposalsRegistering()
                await expect(vote.startProposalsRegistering()).to.be.revertedWith('Registering proposals cant be started now')
                await vote.startVotingSession()
                await expect(vote.startProposalsRegistering()).to.be.revertedWith('Registering proposals cant be started now')
                await vote.endVotingSession()
                await expect(vote.startProposalsRegistering()).to.be.revertedWith('Registering proposals cant be started now')
            });
            it('should NOT end Proposal registering if incorrect WF', async function () {
                await expect(vote.endProposalsRegistering()).to.be.revertedWith('Registering proposals havent started yet')
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await expect(vote.endProposalsRegistering()).to.be.revertedWith('Registering proposals havent started yet')
                await vote.startVotingSession()
                await expect(vote.endProposalsRegistering()).to.be.revertedWith('Registering proposals havent started yet')
                await vote.endVotingSession()
                await expect(vote.endProposalsRegistering()).to.be.revertedWith('Registering proposals havent started yet')
            });
            it('should NOT start voting session in incorrect WF', async function () {
                await expect(vote.startVotingSession()).to.be.revertedWith('Registering proposals phase is not finished')
                await vote.startProposalsRegistering()
                await expect(vote.startVotingSession()).to.be.revertedWith('Registering proposals phase is not finished')
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await expect(vote.startVotingSession()).to.be.revertedWith('Registering proposals phase is not finished')
                await vote.endVotingSession()
                await expect(vote.startVotingSession()).to.be.revertedWith('Registering proposals phase is not finished')
            });
            it('should NOT end voting session if incorrect WF', async function () {
                await expect(vote.endVotingSession()).to.be.revertedWith('Voting session havent started yet')
                await vote.startProposalsRegistering()
                await expect(vote.endVotingSession()).to.be.revertedWith('Voting session havent started yet')
                await vote.endProposalsRegistering()
                await expect(vote.endVotingSession()).to.be.revertedWith('Voting session havent started yet')
                await vote.startVotingSession()
                await vote.endVotingSession()
                await expect(vote.endVotingSession()).to.be.revertedWith('Voting session havent started yet')
            });
            it('should NOT launch tallyVotes', async function () {
                await expect(vote.tallyVotes()).to.be.revertedWith("Current status is not voting session ended")
                await vote.startProposalsRegistering()
                await expect(vote.tallyVotes()).to.be.revertedWith("Current status is not voting session ended")
                await vote.endProposalsRegistering()
                await expect(vote.tallyVotes()).to.be.revertedWith("Current status is not voting session ended")
                await vote.startVotingSession()
                await expect(vote.tallyVotes()).to.be.revertedWith("Current status is not voting session ended")
                await vote.endVotingSession()
                
            });
        })    
})